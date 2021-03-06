import * as Rx from '../../dist/cjs/Rx';
declare const {hot, expectObservable};
import {DoneSignature} from '../helpers/test-helper';

const BehaviorSubject = Rx.BehaviorSubject;
const Observable = Rx.Observable;
const ObjectUnsubscribedError = Rx.ObjectUnsubscribedError;

/** @test {BehaviorSubject} */
describe('BehaviorSubject', () => {
  it('should extend Subject', (done: DoneSignature) => {
    const subject = new BehaviorSubject(null);
    expect(subject instanceof Rx.Subject).toBe(true);
    done();
  });

  it('should throw if it has received an error and getValue() is called', () => {
    const subject = new BehaviorSubject(null);
    subject.error(new Error('derp'));
    expect(() => {
      subject.getValue();
    }).toThrow(new Error('derp'));
  });

  it('should throw an ObjectUnsubscribedError if getValue() is called ' +
    'and the BehaviorSubject has been unsubscribed', () => {
    const subject = new BehaviorSubject('hi there');
    subject.unsubscribe();
    expect(() => {
      subject.getValue();
    }).toThrow(new ObjectUnsubscribedError());
  });

  it('should have a getValue() method to retrieve the current value', () => {
    const subject = new BehaviorSubject('staltz');
    expect(subject.getValue()).toBe('staltz');

    subject.next('oj');

    expect(subject.getValue()).toBe('oj');
  });

  it('should not allow you to set `value` directly', () => {
    const subject = new BehaviorSubject('flibberty');

    try {
      subject.value = 'jibbets';
    } catch (e) {
      //noop
    }

    expect(subject.getValue()).toBe('flibberty');
    expect(subject.value).toBe('flibberty');
  });

  it('should still allow you to retrieve the value from the value property', () => {
    const subject = new BehaviorSubject('fuzzy');
    expect(subject.value).toBe('fuzzy');
    subject.next('bunny');
    expect(subject.value).toBe('bunny');
  });

  it('should start with an initialization value', (done: DoneSignature) => {
    const subject = new BehaviorSubject('foo');
    const expected = ['foo', 'bar'];
    let i = 0;

    subject.subscribe((x: string) => {
      expect(x).toBe(expected[i++]);
    }, null, done);

    subject.next('bar');
    subject.complete();
  });

  it('should pump values to multiple subscribers', (done: DoneSignature) => {
    const subject = new BehaviorSubject('init');
    const expected = ['init', 'foo', 'bar'];
    let i = 0;
    let j = 0;

    subject.subscribe((x: string) => {
      expect(x).toBe(expected[i++]);
    });

    subject.subscribe((x: string) => {
      expect(x).toBe(expected[j++]);
    }, null, done);

    expect(subject.observers.length).toBe(2);
    subject.next('foo');
    subject.next('bar');
    subject.complete();
  });

  it('should not allow values to be nexted after a return', (done: DoneSignature) => {
    const subject = new BehaviorSubject('init');
    const expected = ['init', 'foo'];

    subject.subscribe((x: string) => {
      expect(x).toBe(expected.shift());
    }, null, done);

    subject.next('foo');
    subject.complete();

    expect(() => {
      subject.next('bar');
    }).toThrow(new Rx.ObjectUnsubscribedError());
  });

  it('should clean out unsubscribed subscribers', (done: DoneSignature) => {
    const subject = new BehaviorSubject('init');

    const sub1 = subject.subscribe((x: string) => {
      expect(x).toBe('init');
    });

    const sub2 = subject.subscribe((x: string) => {
      expect(x).toBe('init');
    });

    expect(subject.observers.length).toBe(2);
    sub1.unsubscribe();
    expect(subject.observers.length).toBe(1);
    sub2.unsubscribe();
    expect(subject.observers.length).toBe(0);
    done();
  });

  it('should replay the previous value when subscribed', () => {
    const behaviorSubject = new BehaviorSubject('0');
    function feedNextIntoSubject(x) { behaviorSubject.next(x); }
    function feedErrorIntoSubject(err) { behaviorSubject.error(err); }
    function feedCompleteIntoSubject() { behaviorSubject.complete(); }

    const sourceTemplate =  '-1-2-3----4------5-6---7--8----9--|';
    const subscriber1 = hot('      (a|)                         ').mergeMapTo(behaviorSubject);
    const unsub1 =          '                     !             ';
    const expected1   =     '      3---4------5-6--             ';
    const subscriber2 = hot('            (b|)                   ').mergeMapTo(behaviorSubject);
    const unsub2 =          '                         !         ';
    const expected2   =     '            4----5-6---7--         ';
    const subscriber3 = hot('                           (c|)    ').mergeMapTo(behaviorSubject);
    const expected3   =     '                           8---9--|';

    expectObservable(hot(sourceTemplate).do(
      feedNextIntoSubject, feedErrorIntoSubject, feedCompleteIntoSubject
    )).toBe(sourceTemplate);
    expectObservable(subscriber1, unsub1).toBe(expected1);
    expectObservable(subscriber2, unsub2).toBe(expected2);
    expectObservable(subscriber3).toBe(expected3);
  });

  it('should emit complete when subscribed after completed', () => {
    const behaviorSubject = new BehaviorSubject('0');
    function feedNextIntoSubject(x) { behaviorSubject.next(x); }
    function feedErrorIntoSubject(err) { behaviorSubject.error(err); }
    function feedCompleteIntoSubject() { behaviorSubject.complete(); }

    const sourceTemplate =  '-1-2-3--4--|';
    const subscriber1 = hot('               (a|)').mergeMapTo(behaviorSubject);
    const expected1   =     '               |   ';

    expectObservable(hot(sourceTemplate).do(
      feedNextIntoSubject, feedErrorIntoSubject, feedCompleteIntoSubject
    )).toBe(sourceTemplate);
    expectObservable(subscriber1).toBe(expected1);
  });

  it('should be an Observer which can be given to Observable.subscribe', (done: DoneSignature) => {
    const source = Observable.of(1, 2, 3, 4, 5);
    const subject = new BehaviorSubject(0);
    const expected = [0, 1, 2, 3, 4, 5];

    subject.subscribe(
      (x: number) => {
        expect(x).toBe(expected.shift());
      }, (x) => {
        done.fail('should not be called');
      }, () => {
        done();
      });

    source.subscribe(subject);
  });
});