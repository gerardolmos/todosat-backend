const {test}=require('node:test');
const assert=require('node:assert/strict');
const validator=require('../../node_modules/@strapi/core/dist/services/entity-validator');
const schema=require('../../src/api/operador/content-types/operador/schema.json');
const model={uid:'api::fixture.fixture',info:{displayName:'Fixture'},attributes:{bandas_frecuencia:schema.attributes.bandas_frecuencia}};
global.strapi={getModel:()=>model,db:{query:()=>{throw Error('DB forbidden')}}};
test('optional string without default; accepts real-world bands',async()=>{
 assert.deepEqual(schema.attributes.bandas_frecuencia,{type:'string'});
 for(const value of [undefined,null,'','Ku / Ka; 10.7–12.7 GHz']){
 const data=value===undefined?{}:{bandas_frecuencia:value};
 assert.equal((await validator.validateEntityCreation(model,data,{isDraft:true})).bandas_frecuencia,value);
 }
});
test('unrelated update preserves existing bands',async()=>{
 const entity={id:1,bandas_frecuencia:'Ku'};
 assert.equal((await validator.validateEntityUpdate(model,{}, {isDraft:true},entity)).bandas_frecuencia,undefined);
 assert.equal(entity.bandas_frecuencia,'Ku');
});
