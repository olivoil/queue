var isNode = typeof process !== 'undefined' && process.versions && !!process.versions.node && typeof require !== 'undefined';
var Queue = require(isNode ? '..' : 'queue');
if(!isNode) require('chai').should();
var nextTick = require('next-tick');

describe('Queue#push(fn)', function(){
  it('should process jobs in order', function(done){
    var q = new Queue;
    var calls = [];

    q.push(function(fn){
      calls.push('one');
      setTimeout(function(){
        calls.push('two');
        fn();
      }, 100);
    });


    q.push(function(fn){
      calls.push('three');
      setTimeout(function(){
        calls.push('four');
        fn();
      }, 100);
    });

    q.push(function(fn){
      calls.push('five');
      setTimeout(function(){
        fn();
        calls.should.eql(['one', 'two', 'three', 'four', 'five']);
        done();
      }, 100);
    });
  })

  it('should accept a priority', function(done){
    var q = new Queue;
    var calls = [];

    q.push(function(fn){
      calls.push('five');
      setTimeout(function(){
        calls.push('six');
        fn();
      }, 100);
    });

    q.push(function(fn){
      calls.push('three');
      setTimeout(function(){
        calls.push('four');
        fn();
      }, 100);
    }, 0);

    q.push(function(fn){
      calls.push('one');
      setTimeout(function(){
        calls.push('two');
        fn();
      }, 100);
    }, 1);


    q.push(function(fn){
      calls.push('seven');
      setTimeout(function(){
        fn();
        calls.should.eql(['one', 'two', 'three', 'four', 'five', 'six', 'seven']);
        done();
      }, 100);
    });
  })

  it('should support .concurrency', function(done){
    var q = new Queue({ concurrency: 5, timeout: 2000 });
    var calls = [];

    q.push(function(fn){
      calls.push('one');
      setTimeout(function(){
        calls.push('two');
        fn();
      }, 100);
    });


    q.push(function(fn){
      calls.push('three');
      setTimeout(function(){
        calls.push('four');
        fn();
      }, 100);
    });

    q.push(function(fn){
      calls.push('five');
      setTimeout(function(){
        fn();
        calls.should.have.length(5);
        calls.should.include('one');
        calls.should.include('two');
        calls.should.include('three');
        calls.should.include('four');
        calls.should.include('five');
        done();
      }, 100);
    });
  })
})

describe('Queue#flush', function(){
  it("should remove jobs that haven't run yet", function(done){
    var q = new Queue;
    var calls = [];

    q.push(function(fn){
      calls.push('one');
      setTimeout(function(){
        calls.push('two');
        fn();
      }, 100);
    });

    q.push(function(fn){
      calls.push('flushed');
      fn();
    });

    nextTick(function(){
      q.flush();

      q.push(function(fn){
        calls.push('three');
        setTimeout(function(){
          fn();
          calls.should.eql(['one', 'two', 'three']);
          done();
        }, 100);
      });
    });

  })
})
