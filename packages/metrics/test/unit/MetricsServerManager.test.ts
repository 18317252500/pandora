import {MetricsServerManager} from '../../src/MetricsServerManager';
import {MetricsClient} from '../../src/MetricsClient';
import {expect} from 'chai';
import {Counter as CounterProxy, Gauge as GaugeProxy, Timer as TimerProxy, Histogram as HistogramProxy, Meter as MeterProxy, FastCompass as FastCompassProxy} from '../../src/client/index';
import {MetricName, BaseCounter, BaseGauge, BaseHistogram, BaseMeter, BaseTimer, BaseFastCompass} from '../../src/common/index';
import {MetricsConstants} from '../../src/MetricsConstants';
import * as assert from 'assert';

describe('/test/unit/MetricsServerManager.test.ts', () => {

  let server;
  let client;

  before((done) => {
    server = new MetricsServerManager();
    client = new MetricsClient();
    setTimeout(done, 100);
  });

  after(() => {
    server.destroy();
    server = null;
  });

  it('test server base method', () => {
    expect(server.isEnabled()).to.be.true;
    server.setEnabled(false);
    expect(server.isEnabled()).to.be.false;
    server.setEnabled(true);
    server.setLogger(console);

    expect(server.getGauges('empty').size).to.equal(0);
    expect(server.getHistograms('empty').size).to.equal(0);
    expect(server.getCounters('empty').size).to.equal(0);
    expect(server.getTimers('empty').size).to.equal(0);
    expect(server.getMeters('empty').size).to.equal(0);
    expect(server.getFastCompasses('empty').size).to.equal(0);
  });

  it('create a new client and register it', () => {
    expect(server.getClients().length > 0).to.be.true;
    expect(server.getClients()[0]['_APP_NAME']).to.exist;
    expect(server.getClients()[0]['_CLIENT_ID']).to.exist;
  });


  it('register counter metric', (done) => {
    let counter = new CounterProxy();
    let name = MetricName.build('test.qps.count');
    client.register('test', name, counter);
    counter.inc(5);
    counter.inc(5);
    counter.inc(5);
    counter.inc(5);

    setTimeout(() => {
      expect((<BaseCounter>server.getMetric(name.tagged({
        appName: MetricsConstants.METRICS_DEFAULT_APP,
      }))).getCount()).to.equal(20);
      done();
    }, 10);
  });

  it('register gauge metric',  (done) => {
    let name = MetricName.build('test.qps.gauge.value');
    client.register('test', name, <GaugeProxy<number>> {
      getValue() {
        return 100;
      }
    });

    setTimeout(async () => {
      let result = await (<BaseGauge<any>>server.getMetric(name.tagged({
        appName: MetricsConstants.METRICS_DEFAULT_APP,
      }))).getValue();

      expect(result).to.equal(100);
      done();
    }, 10);
  });

  it('register other metric', () => {
    let timer = new TimerProxy();
    client.register('test_extra', MetricName.build('test.qps.timer'), timer);

    let histogram = new HistogramProxy();
    client.register('test_extra', MetricName.build('test.qps.histogram'), histogram);

    let meter = new MeterProxy();
    client.register('test_extra', MetricName.build('test.qps.meter'), meter);

    let fastCompass = new FastCompassProxy();
    client.register('test_extra', MetricName.build('test.qps.fastCompass'), fastCompass);
  });


  it('register metric from server and client', (done) => {
    client.register('test1', MetricName.build('reporter.register.client.uv'), new CounterProxy());
    client.register('test2', MetricName.build('reporter.register.client.cpu'), <GaugeProxy<number>> {
      getValue() {
        return 100;
      }
    });

    server.register('test1', MetricName.build('reporter.register.pv'), new BaseCounter());
    server.register('test2', MetricName.build('reporter.register.mem'), <BaseGauge<number>> {
      getValue() {
        return 1;
      }
    });

    setTimeout(() => {
      expect(server.listMetricGroups().length > 2).to.be.true;
      expect(server.getCounters('test1').size).to.equal(2);
      done();
    }, 10);
  });

  it('test get metric method', () => {
    const counter = server.getCounter('middleware', MetricName.build('reporter.test.counter'));
    expect(counter).to.be.an.instanceof(BaseCounter);

    const histogram = server.getHistogram('middleware', MetricName.build('reporter.test.histogram'));
    expect(histogram).to.be.an.instanceof(BaseHistogram);

    const timer = server.getTimer('middleware', MetricName.build('reporter.test.timer'));
    expect(timer).to.be.an.instanceof(BaseTimer);

    const meter = server.getMeter('middleware', MetricName.build('reporter.test.meter'));
    expect(meter).to.be.an.instanceof(BaseMeter);

    const fastCompass = server.getFastCompass('middleware', MetricName.build('reporter.test.fastCompass'));
    expect(fastCompass).to.be.an.instanceof(BaseFastCompass);

    expect(server.listMetricNamesByGroup().size > 0).to.be.true;
    expect(server.listMetricNamesByGroup().get('middleware').length).to.equal(5);
    expect(server.getAllCategoryMetrics().size).to.equal(6);
  });

  it('should test get method', () => {
    const counter1 = client.getCounter('getter', 'getter.test.counter');
    const counter2 = client.getCounter('getter', 'getter.test.counter');
    assert(counter1 === counter2);

    const meter1 = client.getMeter('getter', 'getter.test.meter');
    const meter2 = client.getMeter('getter', 'getter.test.meter');
    assert(meter1 === meter2);

    const timer1 = client.getTimer('getter', 'getter.test.timer');
    const timer2 = client.getTimer('getter', 'getter.test.timer');
    assert(timer1 === timer2);

    const fastCompass1 = client.getFastCompass('getter', 'getter.test.fastCompass');
    const fastCompass2 = client.getFastCompass('getter', 'getter.test.fastCompass');
    assert(fastCompass1 === fastCompass2);

    const histogram1 = client.getHistogram('getter', 'getter.test.histogram');
    const histogram2 = client.getHistogram('getter', 'getter.test.histogram');
    assert(histogram1 === histogram2);
  });

});
