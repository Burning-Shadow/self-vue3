import { effect, stop } from "../effect";
import { reactive } from "../reactive";

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({ age: 10 });

    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });

  it('should return runner when call effect', () => {
    // 1. effect(fn) -> function (runner) -> fn with context -> runner() -> result
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return 'foo';
    });

    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe('foo');
  });

  it('scheduler', () => {
    /**
     * 1. 通过 effect 的第二个参数给定一个 scheduler:Function
     * 2. effect 第一次执行时会执行 fn
     * 3. 当响应式对象触发 set 操作时候 update 不会执行 fn，而是执行 scheduler
     * 4. 当执行 runner 时会再次执行 fn
    */
    let dummy;
    let run: any;
    const scheduler: Function = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner: Function = effect(() => {
      dummy = obj.foo;
    }, { scheduler });

    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // should not run yet
    expect(dummy).toBe(1);
    // manually run
    run();
    // should have run
    expect(dummy).toBe(2);
  });

  it('stop --> stop to watch reactive obj', () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => dummy = obj.prop);
    obj.prop = 2;

    expect(dummy).toBe(2);
    stop(runner);
    // obj.prop = 3;
    obj.prop++; // 自增会涉及 get & set 操作，故需避开 get 时的依赖收集
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });

  it('onStop', () => {
    const obj = reactive({ foo: 1 });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(() => {
      dummy = obj.foo
    }, { onStop });

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
