/**
 * 创建一个虚拟的渲染器
 * 屏蔽渲染器概念，并需使用以下功能
 * flushSync 进行同步更新
 * isAlreadyRendering 判断 react 是否正在渲染
 */
import Reconciler from 'react-reconciler';

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

if (process?.env?.NODE_ENV === 'development') {
  reconciler.injectIntoDevTools({
    bundleType: 0,
    rendererPackageName: 'anywhere-hook',
    version: '1.0.0',
  });
}

// @ts-ignore different between 17 and 18
export const container = reconciler.createContainer({}, 0, null, false, false, '', console.error, null);
