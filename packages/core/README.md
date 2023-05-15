脱离 react 组件内才能使用 hook 的限制 ，随处使用 react hook

# 安装

**使用 react 17 时**
```
// react 17 支持的最后一个 react-reconciler 版本为 0.26.2
npm i use-hook-anywhere react-reconciler@0.26.2
```

**使用 react 18 时**
```
// react-reconciler >= 0.27.0 即可
npm i use-hook-anywhere react-reconciler
```

# 基本用法
```tsx
import { usePagination as _usePagination } from "ahooks";
import { createExecutor } from "use-hook-anywhere";
import { getUserList } from '@/service'

const usePagination = createExecutor(_usePagination);
const { data, loading } = usePagination(getUserList);
```

# 原理

自定义渲染器，将 hook 放入自定义组件树中执行。

# API

### 配置项
```ts
{
    // jsx key，未传入自动生成
    key?: string;
    // 判断 hook 执行返回值是否属于一次更新，默认使用全等运算符
    isEqual?: (prev: ReturnType<T>, next: ReturnType<T>) => boolean;
    // 设置默认值，如果没有传入，则第一次将同步挂载
    defaultValue?: ReturnType<T>;
}
```

示例：
```tsx
createExecutor(_usePagination,{
    key: 'pagination',
    // 只在 loading 变化时才去触发更新
    isEqual: ({ loading: a }, { loading: b }) => a === b,
    defaultValue: { loading: true }
});
```

### subscribe 和 unsubscribe

```ts
const fn = ({data, loading}) => {
    console.log(data, loading)
}

// 你可以订阅每次更新结果
usePagination.subscribe(fn)

// 取消订阅
usePagination.unsubscribe(fn)
```

## setHook
重新设置 hook，并返回 this 为新的类型，这在需要提前引用 executor 的场景比较有用

```ts
// 随意传入一个函数作为 hook
const usePagination = createExecutor(()=>{});

usePagination.subscribe(console.log)

import { usePagination as _usePagination } from "ahooks";
// 在真正执行的地方再设置 hook
const { data, loading } = usePagination.setHook(_usePagination)(getUserList);
```

## 生命周期

### 状态图

![VZ9lQU.png](https://i.328888.xyz/2023/05/15/VZ9lQU.png)

### suspend 和 resume

调用 `suspend()` ，"悬停"这个 hook，**将 hook 从 react 组件树卸载**
```ts
// 传入 true，则会同步卸载 hook，默认为 false
usePagination.suspend(true);
// 调用 suspend 后，不再更新 hook 返回值，调用返回最后设置的值
usePagination(getUserList)
```

如果你想重新挂载，可以调用 `resume()`，调用后恢复可执行状态(但此时未挂载)
```ts
usePagination.suspend(true);

// 恢复可执行状态，但未挂载
usePagination.resume();
// resume 后第一次调用将重新挂载
usePagination(getUserList)
```

请注意，若 `suspend()` 和 `resume()` 在同一个事件循环中调用，react 可能合并结果而跳过卸载，无法起到重新挂载的效果 ，请改为 `suspend(true)` 同步卸载 hook 或 `remount()`

### unmount
完全卸载 hook，不能再重新挂载
```ts
// 传入 true 时为重置返回值，
usePagination.unmount(true);
// 若未重置返回值，调用返回最后设置的值
// 若重置返回值，调用时，返回 defaultValue（若有）或者报错
usePagination(getUserList)
```

### remount 
重新挂载 hook，步骤为同步 suspend 后 resume
```ts
// remount 执行以下操作
usePagination.suspend(true);
usePagination.resume();
```


