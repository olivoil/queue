
var isNode = typeof process !== 'undefined' && process.versions && !!process.versions.node && typeof require !== 'undefined';
var Queue = require(isNode ? '..' : 'queue');
var assert = isNode ? require('assert') : require('chai').assert;

describe('Queue .timeout', function(){
  it('should timeout jobs', function(done){
    var q = new Queue({ timeout: 1000 });
    var calls = [];

    q.push(function(done){
      setTimeout(done, 4000);
    }, function(err){
      err.message.should.equal('Timeout of 1000ms exceeded');
      done();
    });
  })

  it('should run subsequent jobs', function(done){
    var q = new Queue({ timeout: 500 });
    var calls = [];

    q.push(function(done){
      setTimeout(function(){
        calls.push(1);
        done();
      }, 5000);
    }, function(err){
      assert(err.timeout);
    });

    q.push(function(done){
      setTimeout(function(){
        calls.push(2);
        done();
      }, 5000);
    }, function(err){
      assert(err.timeout);
    });

    q.push(function(done){
      setTimeout(function(){
        calls.push(3);
        done();
      }, 100);
    }, function(err){
      assert(!err, '3 should not timeout');
    });

    q.push(function(done){
      setTimeout(function(){
        calls.push(4);
        done();
      }, 100);
    }, function(err){
      assert(!err, '4 should not timeout');
    });

    q.push(function(){
      calls.should.eql([3,4]);
      done();
    });
  })
})
