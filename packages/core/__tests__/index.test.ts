import { useHookOnePlace, HookExecutor, createExecutor } from '../src/index';
import { usePagination as _usePagination } from 'ahooks';
import { reconciler } from '../src/reconciler';
import Mock from 'mockjs';
import sinon from 'sinon';

interface UserListItem {
  id: string;
  name: string;
  gender: 'male' | 'female';
  email: string;
  disabled: boolean;
}

afterEach(() => {
  sinon.restore();
});

const userList = (current: number, pageSize: number) =>
  Mock.mock({
    total: 55,
    [`list|${pageSize}`]: [
      {
        'id': '@guid',
        'name': '@name',
        'gender|1': ['male', 'female'],
        'email': '@email',
        'disabled': false,
      },
    ],
  });

export async function getUserList(params: {
  current: number;
  pageSize: number;
}): Promise<{ total: number; list: UserListItem[] }> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(userList(params.current, params.pageSize));
    }, 300);
  });
}

describe('useHookOnePlace', () => {
  test('config is key(string)', async () => {
    const key = 'test-one';
    const usePagination = useHookOnePlace(_usePagination, key);
    // 相同 key 返回相同
    expect(useHookOnePlace(() => {}, key)).toBe(usePagination);

    // 初始化
    const p1 = new Promise<any>(resolve => {
      usePagination.subscribe(resolve);
    });
    usePagination.use(getUserList);
    const { loading: loading1 } = await p1;
    expect(loading1).toBe(true);
    usePagination.unmount();
  });

  test('config is object', async () => {
    const key = 'test-one';
    let r1: (res: any) => void;
    const p1 = new Promise<any>(resolve => (r1 = resolve));
    const usePagination = useHookOnePlace(_usePagination, { key, onUpdate: res => r1(res) });
    // 相同 key 返回相同
    expect(useHookOnePlace(() => {}, key)).toBe(usePagination);
    usePagination.use(getUserList);
    const { loading: loading1 } = await p1;
    expect(loading1).toBe(true);
    usePagination.unmount();
  });
});

describe('HookExecutor', () => {
  test('reset with defaultValue', () => {
    const usePagination1 = new HookExecutor(_usePagination, {
      // @ts-expect-error
      defaultValue: { loading: true },
    });
    usePagination1.use(getUserList);
    usePagination1.resetValue();
    expect(usePagination1.value.loading).toBe(true);

    const usePagination2 = new HookExecutor(_usePagination, {
      // @ts-expect-error
      defaultValue: { loading: false },
    });
    usePagination2.use(getUserList);
    usePagination2.resetValue();
    expect(usePagination2.value.loading).toBe(false);

    usePagination1.unmount();
    usePagination2.unmount();
  });

  test('reset and suspend with no defaultValue', () => {
    const usePagination1 = createExecutor(_usePagination);
    usePagination1(getUserList);
    usePagination1.resetValue();
    // 挂起等同于可恢复的 unmounted
    usePagination1.suspend();
    expect(() => {
      // 挂起后且无默认值不允许 use
      usePagination1.use(getUserList);
    }).toThrow();
    usePagination1.resume();
    // 恢复后可以使用，且会重新挂载
    expect(usePagination1.use(getUserList).loading).toBe(true);

    usePagination1.unmount();
    const spy = jest.spyOn(console, 'warn'); // 创建间谍函数
    // 非 suspended 状态不可 resume，否则有个警告
    usePagination1.resume();
    expect(spy).toHaveBeenCalledTimes(1);

    // 非 running 状态不可 suspend，否则有个警告
    usePagination1.unmount();
    usePagination1.suspend();
    expect(spy).toHaveBeenCalledTimes(2);

    const r = { loading: false };
    // @ts-expect-error test
    usePagination1.setValue(r);
    // @ts-expect-error test
    expect(usePagination1._value).not.toBe(r);

    spy.mockRestore();
  });

  test('remount with forceSync', () => {
    const usePagination1 = createExecutor(_usePagination, {
      // @ts-expect-error
      defaultValue: { loading: false },
    });
    // 伪造 react 正在 rendering
    // @ts-expect-error
    if (reconciler.isAlreadyRendering) {
      // @ts-expect-error
      sinon.stub(reconciler, 'isAlreadyRendering').returns(true);
    }
    expect(usePagination1(getUserList).loading).toBe(true);
    usePagination1.remount();
    // 同步渲染都是返回 true
    expect(usePagination1(getUserList).loading).toBe(true);

    usePagination1.unmount();
  });

  test('unmount with resetValue', () => {
    const usePagination1 = createExecutor(_usePagination);
    // @ts-expect-error
    if (reconciler.isAlreadyRendering) {
      // @ts-expect-error
      sinon.stub(reconciler, 'isAlreadyRendering').returns(true);
    }
    usePagination1(getUserList);
    usePagination1.unmount(true);
    expect(() => {
      // 卸载后且重置值不允许 use
      usePagination1(getUserList);
    }).toThrow();
  });

  test('scribe and unsubscribe', async () => {
    const usePagination1 = new HookExecutor(_usePagination);
    const f1 = jest.fn();
    const f2 = jest.fn();
    usePagination1.subscribe(f1);
    usePagination1.subscribe(f2);
    usePagination1.unsubscribe(f1);
    usePagination1.use(getUserList);
    await new Promise(r => setTimeout(r, 500));
    // f1 被 unsubscribe 后不会被调用
    expect(f1).toHaveBeenCalledTimes(0);
    expect(f1.mock.calls.length).toBeLessThan(f2.mock.calls.length);
  });

  test('setHook', () => {
    const usePagination1 = createExecutor(() => {});
    expect(usePagination1.setHook(_usePagination)(getUserList).loading).toBe(true);
  });
});
