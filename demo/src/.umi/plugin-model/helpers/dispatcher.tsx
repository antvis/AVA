// @ts-nocheck
export default class Dispatcher {
  callbacks = {};

  data = {};

  update = (namespace: string) => {
    (this.callbacks[namespace] || []).forEach(
      (callback: (val: any) => void) => {
        try {
          const data = this.data[namespace];
          callback(data);
        } catch (e) {
          callback(undefined);
        }
      },
    );
  };
}
