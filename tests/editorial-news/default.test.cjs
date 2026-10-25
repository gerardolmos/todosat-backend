const {test}=require('node:test');
const assert=require('node:assert/strict');
const validator=require('../../node_modules/@strapi/core/dist/services/entity-validator');
const schema=require('../../src/api/noticia/content-types/noticia/schema.json');
const model={uid:'api::fixture.fixture',info:{displayName:'Fixture'},attributes:{destacado:schema.attributes.destacado}};
global.strapi={getModel:()=>model,db:{query:()=>{throw Error('DB forbidden')}}};
test('creation omitted defaults false; explicit editorial choices remain',async()=>{
 assert.equal((await validator.validateEntityCreation(model,{}, {isDraft:true})).destacado,false);
 for(const value of [true,false]) assert.equal((await validator.validateEntityCreation(model,{destacado:value},{isDraft:true})).destacado,value);
});
test('unrelated update does not reset existing featured flag',async()=>{
 const old={id:1,destacado:true};
 const update=await validator.validateEntityUpdate(model,{}, {isDraft:true},old);
 assert.equal(update.destacado,undefined);assert.equal(old.destacado,true);
});
