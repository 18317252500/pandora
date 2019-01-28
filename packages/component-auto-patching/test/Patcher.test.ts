import { Patcher } from '../src/Patcher';
import { CLS } from '../src/cls';
import { CURRENT_CONTEXT } from '../src/constants';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { consoleLogger } from 'pandora-dollar';

describe('Patcher', () => {
  let cls;

  before(() => {
    cls = CLS.getInstance();
  });

  it('should custom patcher work well', (done) => {
    class CustomPatcher extends Patcher {
      target() {
        super.target();
        return 'custom';
      }

      attach() {
        super.attach();
        consoleLogger.log('attach');
      }
    }

    cls.run(() => {
      cls.set(CURRENT_CONTEXT, {
        test: 1
      });

      const cp = new CustomPatcher({
        config: {}
      });

      const context: any = cp.currentContext;

      expect(context.test).to.equal(1);

      cp.currentContext = {
        traceId: '1',
        traceName: '2'
      };

      const _context = cls.get(CURRENT_CONTEXT);

      expect(_context).to.deep.equal({
        traceId: '1',
        traceName: '2'
      });

      expect(cp.target()).to.equal('custom');

      const spy = sinon.spy(consoleLogger, 'log');

      cp.attach();

      expect(spy.calledWith(sinon.match('attach')));

      spy.restore();

      const ns = cls.namespace;

      expect(ns).to.exist;

      done();
    });
  });
});