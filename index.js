
/**
 * Dependencies.
 */

var isNode = typeof process !== 'undefined' &&
             process.versions && !!process.versions.node;

var Emitter = require(isNode ? 'emitter-component' : 'emitter')
  , nextTick = require('next-tick')
  , debug = require('debug')('queue');

/**
 * Expose `Queue`
 */

exports = module.exports = Queue;

/**
 * Setup a `Queue` with `options`.
 *
 * @param {Object} options
 */

function Queue(options){
  options || (options = {});
  this.timeout = options.timeout || 0;
  this.concurrency = options.concurrency || 1;
  this.pending = 0;
  this.jobs = [];
  debug('timeout %s', this.timeout);
  debug('concurrency %s', this.concurrency);
}


/**
 * Mixin `Emitter`.
 */

Emitter(Queue.prototype);


/**
 * Return queue length.
 *
 * @return {Number}
 * @api public
 */

Queue.prototype.__defineGetter__('length', function(){
  return this.pending + this.jobs.length;
});


/**
 * Queue `fn` for execution.
 *
 * @param {Function} fn
 * @param {Function} [cb]
 * @param {Number} p
 * @api public
 */

Queue.prototype.push = function(fn, cb, p){
  debug('enqueue');

  if(arguments.length < 3 && typeof cb == 'number'){
    p = cb; cb = undefined;
  }

  this.jobs.push([fn, cb, p]);
  this.sorted = false;
  nextTick(this.run.bind(this));
};


/**
 * Sort jobs by priority.
 *
 * @api private
 * @return {Queue}
 */

Queue.prototype.sort = function(){
  var self = this;

  this.jobs.sort(function(left, right){
    var a = left[2];
    var b = right[2];

    if (a !== b) {
      if (a > b || a === void 0) return 1;
      if (a < b || b === void 0) return -1;
    }

    return self.jobs.indexOf(left) - self.jobs.indexOf(right);
  });

  this.sorted = true;
  return this;
}


/**
 * Run jobs at the specified concurrency.
 *
 * @api private
 */

Queue.prototype.run = function(){
  this.sorted || this.sort();

  while (this.pending < this.concurrency) {
    var job = this.jobs.shift();
    if (!job) break;
    this.exec(job);
  }
};


/**
 * Execute `job`.
 *
 * @param {Array} job
 * @api private
 */

Queue.prototype.exec = function(job){
  var self = this;
  var ms = this.timeout;

  debug('process');
  var fn = job[0];
  var cb = job[1];

  if (ms) fn = timeout(fn, ms);

  this.pending++;
  fn(function(err, res){
    cb && cb(err, res);
    self.pending--;
    self.run();
  });
};


/**
 * Decorate `fn` with a timeout of `ms`.
 *
 * @param {Function} fn
 * @param {Function} ms
 * @return {Function}
 * @api private
 */

function timeout(fn, ms) {
  return function(cb){
    var done;

    var id = setTimeout(function(){
      done = true;
      var err = new Error('Timeout of ' + ms + 'ms exceeded');
      err.timeout = timeout;
      cb(err);
    }, ms);

    fn(function(err, res){
      if (done) return;
      clearTimeout(id);
      cb(err, res);
    });
  }
}

