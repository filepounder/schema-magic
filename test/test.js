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

    describe('JSON Generate', function() {
        

        it('generate a simple schema', function () {
            assert.deepEqual(SchemaMagic.generateSchemaFromJSON(null),{type:"null"},"Invalid schema generate");
            assert.deepEqual(SchemaMagic.generateSchemaFromJSON("abc"),{type:"string"},"Invalid schema generate");
            assert.deepEqual(SchemaMagic.generateSchemaFromJSON(1),{type:"integer"},"Invalid schema generate");
            assert.deepEqual(SchemaMagic.generateSchemaFromJSON(new Date()),{type:"string",format:"date-time"},"Invalid schema generate");
            assert.deepEqual(SchemaMagic.generateSchemaFromJSON(1.2),{type:"number"},"Invalid schema generate");
            assert.deepEqual(SchemaMagic.generateSchemaFromJSON(false),{type:"boolean"},"Invalid schema generate");
        });

        it('generate a complex schema', function () {
            let obj={
                "id": 2,
                "name": "An ice sculpture",
                "price": 12.50,
                "tags": ["cold", "ice"],
                "dimensions": {
                    "length": 7.0,
                    "width": 12.0,
                    "height": 9.5
                },
                "warehouseLocation": {
                    "latitude": -78.75,
                    "longitude": 20.4
                }
            };

            let obj2= {
                "id": 3,
                "name": "A blue mouse",
                "price": 25.50,
                "dimensions": {
                    "length": 3.1,
                    "width": 1.0,
                    "height": 1.0
                },
                "warehouseLocation": {
                    "latitude": 54.4,
                    "longitude": -32.7
                }
            };

            let result={
                "type": "object",
                "properties": {
                    "id": {
                        "type": "integer"
                    },
                    "name": {
                        "type": "string"
                    },
                    "price": {
                        "type": "number"
                    },
                    "tags": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    },
                    "dimensions": {
                        "type": "object",
                        "properties": {
                            "length": {
                                "type": "number"
                            },
                            "width": {
                                "type": "integer"
                            },
                            "height": {
                                "type": "number"
                            }
                        }
                    },
                    "warehouseLocation": {
                        "type": "object",
                        "properties": {
                            "latitude": {
                                "type": "number"
                            },
                            "longitude": {
                                "type": "number"
                            }
                        }
                    }
                }

            };

            let x=SchemaMagic.generateSchemaFromJSON(obj);
            let y=SchemaMagic.generateSchemaFromJSON(obj2);
            assert.deepEqual(SchemaMagic.mergeSchemas([x,y]), result, "Invalid schema generate");
        });
    });

    describe('Merge Schemas', function() {

        it('should merge a singel schema', function () {
            let schemas=[
                {type:"string"}
            ];

            let result={
                type:"string"
            };
            assert.deepEqual(SchemaMagic.mergeSchemas(schemas),result,"Invalid schema merge");

        });

        it('should merge a null schema', function () {
            let schemas=[
                {type:"string"},
                null
            ];

            let result={
                type:"string"
            };
            assert.deepEqual(SchemaMagic.mergeSchemas(schemas),result,"Invalid schema merge");

        });

        it('should merge a no schema', function () {
            let schemas=[ ];

            let result=null;
            assert.deepEqual(SchemaMagic.mergeSchemas(schemas),result,"Invalid schema merge");

        });

        it('should merge a simple schema 1', function () {
            let schemas=[
                {type:"string"},
                {type:"string"}
            ];

            let result={
                type:"string"
            };
            assert.deepEqual(SchemaMagic.mergeSchemas(schemas),result,"Invalid schema merge");

        });

        it('should merge a simple schema 2', function () {
            let schemas=[
                {type:"string"},
                {type:"integer"}
            ];

            let result={
                type:["string","integer"]
            };
            assert.deepEqual(SchemaMagic.mergeSchemas(schemas),result,"Invalid schema merge");

        });

        it('should merge an object schema 1', function () {
            let schemas=[
                {
                    type:"object",
                    properties:{
                        val1:{type:"string"}
                    }
                },
                {
                    type:"object",
                    properties:{
                        val2:{type:"integer"}
                    }
                }
            ];

            let result={
                type:"object",
                properties:{
                    val1:{type:"string"},
                    val2:{type:"integer"}
                }
            };
            assert.deepEqual(SchemaMagic.mergeSchemas(schemas),result,"Invalid schema merge");

        });

        it('should merge an object schema 2', function () {
            let schemas=[
                {
                    type:"object",
                    properties:{
                        val1:{type:"string"}
                    }
                },
                {
                    type:"object",
                    properties:{
                        val1:{type:"string"},
                        val2:{type:"integer"}
                    }
                }
            ];

            let result={
                type:"object",
                properties:{
                    val1:{type:"string"},
                    val2:{type:"integer"}
                }
            };
            assert.deepEqual(SchemaMagic.mergeSchemas(schemas),result,"Invalid schema merge");

        });

        it('should merge an object schema 3', function () {
            let schemas=[
                {
                    type:"object",
                    properties:{
                        val1:{type:["string"]}
                    }
                },
                {
                    type:"object",
                    properties:{
                        val1:{type:"integer"},
                        val2:{type:"integer"}
                    }
                }
            ];

            let result={
                type:"object",
                properties:{
                    val1:{type:["string","integer"]},
                    val2:{type:"integer"}
                }
            };
            assert.deepEqual(SchemaMagic.mergeSchemas(schemas),result,"Invalid schema merge");

        });

        it('should merge a simple schema with numbers', function () {
            let schemas=[
                {type:"integer"},
                {type:"number"}
            ];

            let result={
                type:"number"
            };
            assert.deepEqual(SchemaMagic.mergeSchemas(schemas),result,"Invalid schema merge");

        });

        it('should merge equal', function () {
            let schemas=[
                {
                    type:"object",
                    properties:{
                        val1:{type:"string"},
                        val2:{
                            type:"array",
                            items:{
                                type:"string"}
                        },
                        val3:{
                            type:"object",
                            properties:{
                                val4:{type:"string",format:"date-time"}  ,
                                val5:{type:"number"}
                            }
                        }
                    }
                },
                {
                    type:"object",
                    properties:{
                        val1:{type:"string"},
                        val2:{
                            type:"array",
                            items:{
                                type:"string"}
                        },
                        val3:{
                            type:"object",
                            properties:{
                                val4:{type:"string",format:"date-time"}  ,
                                val5:{type:"number"}
                            }
                        }
                    }
                }
            ];

            let result={
                type:"object",
                properties:{
                    val1:{type:"string"},
                    val2:{
                        type:"array",
                        items:{
                            type:"string"}
                    },
                    val3:{
                        type:"object",
                        properties:{
                            val4:{type:"string",format:"date-time"}  ,
                            val5:{type:"number"}
                        }
                    }
                }
            };
            assert.deepEqual(SchemaMagic.mergeSchemas(schemas),result,"Invalid schema merge");

        });

        it('should merge array', function () {
            let schemas=[
                {
                    type:"object",
                    properties:{
                        val1:{type:"string"},
                        val2:{
                            type:"array",
                            items:{
                                type:"string"
                            }
                        },
                        val3:{
                            type:"array",
                            items:{
                                type:"array",
                                items:{
                                    type:"object",
                                    properties:{
                                        valArr1:{type:"string"}
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    type:"object",
                    properties:{
                        val1:{type:"string"},
                        val2:{
                            type:"array",
                            items:{
                                type:"object",
                                properties:{
                                    arrVal1:{type:"number"},
                                    arrVal2:{type:"boolean"}
                                }
                            }
                        },
                        val3:{
                            type:"array",
                            items:{
                                type:"array",
                                items:{
                                    type:"object",
                                    properties:{
                                        valArr2:{type:"integer"}
                                    }
                                }
                            }
                        }
                    }
                }
            ];

            let result={
                type:"object",
                properties:{
                    val1:{type:"string"},
                    val2:{
                        type:"array",
                        items:{
                            type:"object",
                            properties:{
                                arrVal1:{type:"number"},
                                arrVal2:{type:"boolean"}
                            }
                        }
                    },
                    val3:{
                        type:"array",
                        items:{
                            type:"array",
                            items:{
                                type:"object",
                                properties:{
                                    valArr1:{type:"string"},
                                    valArr2:{type:"integer"}
                                }
                            }
                        }
                    }
                }
            };
            assert.deepEqual(SchemaMagic.mergeSchemas(schemas),result,"Invalid schema merge");

        });
        
    });
    
});