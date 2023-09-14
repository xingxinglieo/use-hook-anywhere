/**
 * 创建一个虚拟的渲染器
 * 屏蔽渲染器概念，并需使用以下功能
 * flushSync 进行同步更新
 * isAlreadyRendering 判断 react 是否正在渲染
 */
import Reconciler from 'react-reconciler';
import React, { createElement, useMemo } from 'react';

type AnyFun = (...args: any[]) => void;
type HookProps = {
  key: string;
  hook: AnyFun;
  args: any[];
  onSync: (v: any) => void;
};

const doNothing1 = () => {};
const doNothing2 = () => null;
const doNothing3 = () => false;
const doNothing4 = () => 0;
doNothing1(), doNothing2(), doNothing3(), doNothing4();
export const reconciler = Reconciler({
  supportsMutation: true,
  supportsPersistence: false,
  createInstance: doNothing1,
  createTextInstance: doNothing1,
  appendInitialChild: doNothing1,
  finalizeInitialChildren: doNothing3,
  prepareUpdate: doNothing2,
  clearContainer: doNothing1,
  shouldSetTextContent: doNothing3,
  getRootHostContext: doNothing2,
  getChildHostContext: doNothing1,
  getPublicInstance: doNothing1,
  prepareForCommit: doNothing2,
  resetAfterCommit: doNothing2,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  isPrimaryRenderer: false,
  // @ts-ignore different between 17 and 18
  getCurrentEventPriority: doNothing4,
  getInstanceFromNode: doNothing2,
  beforeActiveInstanceBlur: doNothing1,
  afterActiveInstanceBlur: doNothing1,
  prepareScopeUpdate: doNothing1,
  getInstanceFromScope: doNothing2,
  detachDeletedInstance: doNothing1,
  supportsHydration: false,
  preparePortalMount: doNothing1,
});

reconciler.injectIntoDevTools({
  bundleType: 0,
  rendererPackageName: 'anywhere-hook',
  version: '1.0.0',
});

// @ts-ignore different between 17 and 18
export const container = reconciler.createContainer({}, 0, null, false, false, '', console.error, null);

function Res() {
  return null;
}
const Hook = React.memo(function Hook(props: Omit<HookProps, 'key'>) {
  const { hook, args, onSync } = props;
  const res = hook(...args);
  onSync(res);
  return createElement(Res, { res });
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
export const update = (() => {
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
