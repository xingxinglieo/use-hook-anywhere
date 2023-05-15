import React, { createElement, useMemo } from 'react';
import mitt from 'mitt';
import { reconciler, container } from './reconciler';

const isDevelopment = process?.env?.NODE_ENV === 'development';

type AnyFun = (...args: any[]) => void;
type HookProps = {
  key: string;
  hook: AnyFun;
  args: any[];
  onSync: (v: any) => void;
};

function Res() {
  return null;
}
const Hook = React.memo(function Hook(props: Omit<HookProps, 'key'>) {
  const { hook, args, onSync } = props;
  const res = hook(...args);
  onSync(res);
  return isDevelopment ? createElement(Res, { res }) : null;
});
function HooksContainer({ hooks }: { hooks: HookProps[] }) {
  const HookWrapper = useMemo(() => (props: HookProps) => useMemo(() => <Hook {...props} />, props.args), []);
  return (
    <>
      {hooks.map(props => (
        <HookWrapper {...props} />
      ))}
    </>
  );
}

// 如果 react 正在渲染，setState 则会报警告
// 通过 reconciler.isAlreadyRendering() 判断 react 是否在渲染
// 如果正在渲染，则推入微任务，否则同步执行
// sync 为 true 强制同步渲染，场景为第一次调用 use，无视警告
const update = (() => {
  let hooks = [] as HookProps[];
  return (reducer: (oldProps: HookProps[]) => HookProps[], forceSync?: boolean) => {
    hooks = reducer(hooks);
    // @ts-ignore different between 17 and 18
    const update = () => reconciler.updateContainer(<HooksContainer hooks={hooks} />, container, undefined, () => {});
    // @ts-ignore different between 17 and 18
    if ((reconciler.isAlreadyRendering?.() ?? true) && !forceSync) {
      Promise.resolve().then(update);
    } else {
      // @ts-ignore different between 17 and 18
      reconciler.flushSync(update, undefined);
    }
  };
})();

const UNASSIGN = Symbol('UNASSIGN');
const PREFIX = 'HookAnywhere';
export class HookExecutor<T extends AnyFun> {
  private static count = 0;
  public status: 'running' | 'unmount' | 'suspend' = 'running';
  private key: string;
  private isEqual: (prev: ReturnType<T>, next: ReturnType<T>) => boolean;
  private defaultValue: ReturnType<T> | typeof UNASSIGN = UNASSIGN;
  public readonly emitter = mitt<{ update: ReturnType<T>; umount: void }>();
  private _value: ReturnType<T> | typeof UNASSIGN = UNASSIGN;
  private setValue(newValue: any) {
    // 不在 running 状态不更新
    if (this.status !== 'running') return;
    // 没有 value（第一次设置）时，不需要比较，直接设置
    if (this.noSetValue || !this.isEqual(this.value, newValue)) {
      this.emitter.emit('update', (this._value = newValue));
    }
  }
  private get hasDefault() {
    return this.defaultValue !== UNASSIGN;
  }
  private get noSetValue() {
    return this._value === UNASSIGN;
  }
  public get value() {
    if (this.noSetValue) {
      throw new Error(
        `Possible solutions:
        1. Ensure \`use()\` is before \`unmount()\` and \`suspend()\`.
        2. Configure \`defaultValue\`, because React does not support \`flushSync()\`(synch render) in your condition.
      `,
      );
    }
    return this._value as ReturnType<T>;
  }
  constructor(
    private hook: T,
    config: {
      key?: string;
      isEqual?: (prev: ReturnType<T>, next: ReturnType<T>) => boolean;
      defaultValue?: ReturnType<T>;
    } = {},
  ) {
    const { isEqual: _isEqual, key = PREFIX + HookExecutor.count++ } = config;
    this.key = key;
    this.isEqual = _isEqual ?? ((a, b) => a === b);
    if ('defaultValue' in config) this.defaultValue = config.defaultValue!;
  }

  public setHook<F extends AnyFun>(hook: F) {
    // @ts-expect-error 重置 hook
    this.hook = hook;
    return this as unknown as HookExecutor<F>;
  }

  public resetValue() {
    if (this.hasDefault) this._value = this.defaultValue;
    else this._value = UNASSIGN;
  }

  public use(...args: Parameters<T>) {
    const isUnmounted = this.status === 'unmount';
    const isSuspend = this.status === 'suspend';

    // 如果处于卸载、挂起状态，且赋予了值，返回已有值，否则报错
    if (isUnmounted || isSuspend) {
      return this.value as ReturnType<T>;
    }

    // if (!this.hook) {
    //   throw 'ensure `setHook()` before calling `use()`';
    // }

    update(
      arr => [
        ...arr.filter(item => item.key !== this.key),
        {
          key: this.key,
          hook: this.hook!,
          onSync: this.setValue.bind(this),
          args,
        },
      ],
      // 没有赋予初始值时，强制同步渲染
      this.noSetValue,
    );
    return this.value as ReturnType<T>;
  }

  public subscribe(fn: (value: ReturnType<T>) => void) {
    this.emitter.on('update', fn);
  }

  public unsubscribe(fn: (value: ReturnType<T>) => void) {
    this.emitter.off('update', fn);
  }

  /**
   * @argument forceSync default = true 是否强制同步更新
   */
  public suspend(forceSync = true) {
    if (this.status === 'running') {
      this.status = 'suspend';
      update(hooks => hooks.filter(item => item.key !== this.key), forceSync);
    } else {
      console.warn('`suspend()` and `remount()` can only be called while `running`');
    }
  }

  public resume() {
    if (this.status === 'suspend') {
      this.status = 'running';
    } else {
      console.warn('`resume()` can only be called after `suspend()`');
    }
  }

  /**
   * @argument forceSync = false 是否强制同步更新
   */
  public remount() {
    this.suspend(true);
    this.resume();
  }

  public unmount(reset = false) {
    this.status = 'unmount';
    this.emitter.emit('umount');
    this.emitter.off('umount');
    this.emitter.off('update');
    if (reset) this.resetValue();
    update(arr => arr.filter(item => item.key !== this.key));
  }
}

export interface Executor<T extends AnyFun> extends HookExecutor<T> {
  (...args: Parameters<HookExecutor<T>['use']>): ReturnType<HookExecutor<T>['use']>;
  setHook: <F extends AnyFun>(hook: F) => Executor<F>;
}
export function createExecutor<T extends AnyFun>(...args: ConstructorParameters<typeof HookExecutor<T>>) {
  const executor = function (...args) {
    return executor.use(...args);
  } as Executor<T>;
  Object.defineProperties(executor, Object.getOwnPropertyDescriptors(new HookExecutor(...args)));
  Object.defineProperties(executor, Object.getOwnPropertyDescriptors(HookExecutor.prototype));
  return executor;
}

type OnePlaceConfig<T extends AnyFun> = {
  key: string; // map 的 key
  onUpdate?: (value: ReturnType<T>) => void;
  isEqual?: (prev: ReturnType<T>, next: ReturnType<T>) => boolean;
  defaultValue?: ReturnType<T>;
};

const executorMap = new Map<any, HookExecutor<any>>();
/**
 * @description 内部维护一个 map，记录 key-HookAnywhere，同个 key 仅初始化一次
 *
 */
export function useHookOnePlace<T extends AnyFun>(hook: T, config: OnePlaceConfig<T> | string) {
  const { onUpdate, ...otherConfig } = typeof config === 'string' ? ({} as OnePlaceConfig<T>) : config;
  const key = typeof config === 'string' ? config : config.key;
  if (executorMap.has(key)) {
    return executorMap.get(key) as Executor<T>;
  } else {
    const useHook = createExecutor(hook, otherConfig);
    if (onUpdate) useHook.subscribe(onUpdate);
    useHook.emitter.on('umount', () => executorMap.delete(key));
    executorMap.set(key, useHook);
    return useHook;
  }
}
