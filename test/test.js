const assert = require('assert');
const SchemaMagic=require('../index');

describe('Schema Magic', function() {

    describe('Flatten Schema', function() {
        it('should not flatten an empty schema', function () {
           assert(!SchemaMagic.flattenSchema(),"Invalid result")
        });


        it('should not flatten an empty schema', function () {
            assert.deepEqual(SchemaMagic.flattenSchema("a"),[{path:"",type:"string"}],"Invalid flatten")
        });

        it('should flatten a schema without any type specifier', function () {
            assert.deepEqual(SchemaMagic.flattenSchema({}),[{path:"",type:"object",format:undefined,isArray:false,required:false}],"Invalid flatten")
        });

        it('should flatten a schema with only object', function () {
            assert.deepEqual(SchemaMagic.flattenSchema({type:"object"}),[{path:"",type:"object",isArray:false,required:false}],"Invalid flatten")
        });

        it('should flatten a schema', function () {
            let schema={
                type:"object",
                properties:{
                    val1:{type:"integer"},
                    val2:{type:"string"}
                }
            };

            let output=[
                {
                    path:"val1",
                    type:"integer",
                    format:undefined,
                    isArray:false,
                    required:false
                },
                {
                    path:"val2",
                    type:"string",
                    format:undefined,
                    isArray:false,
                    required:false
                }
            ];
            assert.deepEqual(SchemaMagic.flattenSchema(schema),output,"Invalid flatten")
        });

        it('should flatten a schema with required', function () {
            let schema={
                type:"object",
                properties:{
                    val1:{type:"integer"},
                    val2:{type:"string"}
                },
                required:["val1"]
            };

            let output=[
                {
                    path:"val1",
                    type:"integer",
                    format:undefined,
                    isArray:false,
                    required:true
                },
                {
                    path:"val2",
                    type:"string",
                    format:undefined,
                    isArray:false,
                    required:false
                }
            ];
            assert.deepEqual(SchemaMagic.flattenSchema(schema),output,"Invalid flatten")
        });


        it('should flatten a nested schema', function () {
            let schema={
                type:"object",
                properties:{
                    val1:{type:"integer"},
                    val2:{
                        type:"object",
                        properties:{
                            "a":{type:"number"},
                            b:{type:"string"}
                        }
                    }
                }
            };

            let output=[
                {
                    path:"val1",
                    type:"integer",
                    format:undefined,
                    isArray:false,
                    required:false
                },
                {
                    path:"val2.a",
                    type:"number",
                    format:undefined,
                    isArray:false,
                    required:false
                },
                {
                    path:"val2.b",
                    type:"string",
                    format:undefined,
                    isArray:false,
                    required:false
                }
            ];
            assert.deepEqual(SchemaMagic.flattenSchema(schema),output,"Invalid flatten")
        });

        it('should flatten a nested schema with required', function () {
            let schema={
                type:"object",
                properties:{
                    val1:{type:"integer"},
                    val2:{
                        type:"object",
                        properties:{
                            "a":{type:"number"},
                            b:{type:"string"}
                        }
                    }
                },
                required:["val2"]
            };

            let output=[
                {
                    path:"val1",
                    type:"integer",
                    format:undefined,
                    isArray:false,
                    required:false
                },
                {
                    path:"val2.a",
                    type:"number",
                    format:undefined,
                    isArray:false,
                    required:true
                },
                {
                    path:"val2.b",
                    type:"string",
                    format:undefined,
                    isArray:false,
                    required:true
                }
            ];
            assert.deepEqual(SchemaMagic.flattenSchema(schema),output,"Invalid flatten")
        });

        it('should flatten an array', function () {
            let schema={
                type:"object",
                properties:{
                    val1:{type:"integer"},
                    val2:{
                        type:"array",
                        items:{
                            type:"string"
                        }
                    }
                }
            };

            let output=[
                {
                    path:"val1",
                    type:"integer",
                    format:undefined,
                    isArray:false,
                    required:false
                },
                {
                    path:"val2.n",
                    type:"string",
                    format:undefined,
                    isArray:true,
                    required:false
                }
            ];
            assert.deepEqual(SchemaMagic.flattenSchema(schema),output,"Invalid flatten")
        });

        it('should flatten an array with objects', function () {
            let schema={
                type:"object",
                properties:{
                    val1:{type:"integer"},
                    val2:{
                        type:"array",
                        items:{
                            type:"object",
                            properties:{
                                "a":{type:"number"},
                                b:{type:"string",format:"date-time"}
                            }
                        }
                    }
                }
            };

            let output=[
                {
                    path:"val1",
                    type:"integer",
                    format:undefined,
                    isArray:false,
                    required:false
                },
                {
                    path:"val2.n.a",
                    type:"number",
                    format:undefined,
                    isArray:true,
                    required:false
                },
                {
                    path:"val2.n.b",
                    type:"string",
                    format:"date-time",
                    isArray:true,
                    required:false
                }
            ];
            assert.deepEqual(SchemaMagic.flattenSchema(schema),output,"Invalid flatten")
        });

    });

    describe('Generate SQL Table', function() {
        it('should not generate an empty schema', function () {
            assert(!SchemaMagic.generateSQLTable(),"Invalid result")
        });

        it('should generate a sql table', function () {
            let schema={
                type:"object",
                properties:{
                    val1:{type:"string"},
                    val2:{type:"integer"},
                    val3:{type:"string",format:"date-time"},
                    val4:{type:"number"},
                    val5:{type:"boolean"}
                },
                required:["val1","val2"]
            };

            let output="CREATE TABLE [dbo].[Table1](\r\n" +
                "[Val1] varchar(255) NOT NULL,\r\n" +
                "[Val2] int NOT NULL,\r\n" +
                "[Val3] datetime NULL,\r\n" +
                "[Val4] varchar(255) NULL,\r\n" +
                "[Val5] bit NULL);";

            assert.deepEqual(SchemaMagic.generateSQLTable(schema),output,"Invalid result")
        });

        it('should generate a sql table options', function () {
            let schema={
                type:"object",
                properties:{
                    val1:{type:"string"},
                    val2:{
                        type:"object",
                        properties:{
                            val3:{type:"string",format:"date-time"},
                            val4:{type:"number"},
                            val5:{type:"boolean"}
                        },
                        required:["val3"]
                    }

                },
                required:["val1"]
            };

            let output="CREATE TABLE [dbo].[Test Table](\r\n" +
                "[val1] varchar(255) NOT NULL,\r\n" +
                "[val2_val3] datetime NOT NULL,\r\n" +
                "[val2_val4] varchar(255) NULL,\r\n" +
                "[val2_val5] bit NULL);";

            assert.deepEqual(SchemaMagic.generateSQLTable(schema,"Test Table",{beautify:false}),output,"Invalid result")
        });
    });
});