// 将`key`代理到`target`上
// 访问 this.xxx == 访问 this.sourcekey.xxx
export default function proxy(target, sourceKey, key) {
  Object.defineProperty(target, key, {
    get() {
      return target[sourceKey][key];
    },
    set(newVal) {
      target[sourceKey][key] = newVal;
    },
  });
}
