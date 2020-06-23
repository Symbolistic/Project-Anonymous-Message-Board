/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Create Thread', function(done) {
       chai.request(server)
        .post('/api/threads/test')
        .send({
          text: 'test POST',
          delete_password: 'test',
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          done();
        });
      });
    });
    
    suite('GET', function() {
      test('Get Threads', function(done) {
       chai.request(server)
        .get('/api/threads/test')
        .end(function(err, res){
         assert.equal(res.status, 200);
         assert.equal(res.body[0].board, 'test');
         assert.equal(res.body[0].text, 'test POST');
         assert.isAtMost(res.body.length, 10);
          done();
        });
      });
    });
    
    suite('DELETE', function() {
      test('Delete Thread', function(done) {
       chai.request(server)
        .delete('/api/threads/test')
        .end(function(err, res){
         assert.equal(res.status, 200);
         assert.equal(res.text, "Incorrect Password");      
          done();
        });
      });
    });
    
    suite('PUT', function() {
      test('Report Thread', function(done) {
       chai.request(server)
        .put('/api/threads/test')
        .end(function(err, res){
         assert.equal(res.status, 200);
         assert.equal(res.text, "Success");      
          done();
        });
      });
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Post Reply', function(done) {
       chai.request(server)
        .post('/api/replies/test')
        .send({
          text: 'test REPLY',
          delete_password: 'test',
          thread_id: "5ef264f9f22f6907af382635"
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          done();
        });
      });
    });
    
    suite('GET', function() {
      test('Get Replies', function(done) {
       chai.request(server)
        .get('/api/replies/test/?thread_id=5ef264f9f22f6907af382635')
        .end(function(err, res){
         assert.equal(res.status, 200);
         assert.equal(res.body.board, 'test');
         assert.equal(res.body.replies[0].text, 'test REPLY'); 
         done();
        });
      });
    });
    
    suite('PUT', function() {
      test('Report Reply', function(done) {
       chai.request(server)
        .put('/api/replies/test')
        .end(function(err, res){
         assert.equal(res.status, 200);
         assert.equal(res.text, "Success");      
          done();
        });
      });
    });
    
    suite('DELETE', function() {
      test('Delete Thread', function(done) {
       chai.request(server)
        .delete('/api/replies/test')
        .end(function(err, res){
         assert.equal(res.status, 200);
         assert.equal(res.text, "Incorrect Password");      
          done();
        });
      });
    });
    
  });

});
