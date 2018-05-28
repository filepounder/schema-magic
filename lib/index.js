const $deepcopy=require('deepcopy');
const $json=require('json-magic');
const $check=require('check-types');
const $types=require('type-magic');
const _s=require('underscore.string');
const _=require('underscore');

const _sqlTypeMapping=[
    {
        type:"string",
        sqlType:"varchar(255)",
    },
    {
        type:"integer",
        sqlType:"int",
    },
    {
        type:"boolean",
        sqlType:"bit",
    },
    {
        type:"string",
        format:"date-time",
        sqlType:"datetime",

    },
    {
        type:"string",
        format:"date",
        sqlType:"date",

    },
    {
        type:"array",
        sqlType:"varchar(255)",

    },
    {
        type:"object",
        sqlType:"varchar(255)",

    },
    {
        type:"null",
        sqlType:"varchar(255)",

    }
];

class SchemaMagic {

    //flattens a schema returning an array of paths to access elements of an object
    static flattenSchema(schema,options){
        if (!schema)return schema;
        options=options||{};
        let sep=options.format==="path"?"/":".";

        let paths=[];
        const traverseSchema=(curSchema,curPath,isArray,isRequired)=>{
            if (!curSchema){
                return;
            }else if (curSchema.type==="array"){
                if (curSchema.items){
                    traverseSchema(curSchema.items,curPath.concat(["n"]),true,isRequired);
                }else{
                    paths.push({
                        path:$json.compilePath(curPath.concat(["n"]),sep),
                        isArray:true,
                        type:curSchema.type,
                        required:!!isRequired
                    });
                }
            }else if (curSchema.type==="object"){
                if (curSchema.properties){
                    for (let propName in curSchema.properties){
                        if (!curSchema.properties.hasOwnProperty(propName))continue;
                        traverseSchema(curSchema.properties[propName],curPath.concat([propName]),isArray,isRequired||curSchema.required&&curSchema.required.indexOf(propName)>-1);
                    }
                }else{
                    paths.push({
                        path:$json.compilePath(curPath,sep),
                        type:curSchema.type,
                        isArray:!!isArray,
                        required:!!isRequired
                    });
                }
            }else {
                paths.push({
                    path:$json.compilePath(curPath,sep),
                    type:curSchema.type||"object",
                    format:curSchema.format,
                    isArray:!!isArray,
                    required:!!isRequired
                });
            }
        };

        if (!$check.object(schema)){
            return [{path:"",type:$types.getTypeName(schema)}];
        }


        traverseSchema(schema,[]);

        return paths;

    }

    static generateSQLTable(schema,tableName,options){
        if (!schema)return null;
        options=options||{};
        options.escape=options.escape||'[]';
        options.schema=options.schema||'dbo';
        options.separator=options.separator||'_';
        options.beautify=$check.assigned(options.beautify)?options.beautify:true;
        options.defaultType=options.defaultType||"varchar(255)";

        let charFunc=null;
        if ($check.function(options.escape)){
            charFunc=options.escape;
        }else if (options.escape==="`"){
            charFunc=(item)=>{return "`" + item + "`";};
        }else if (options.escape==="[]"){
            charFunc=(item)=>{return "[" + item + "]";};
        }else if (options.escape){
            charFunc=(item)=>{return options.escape + item + options.escape;};
        }

        tableName=tableName||schema.name||schema.title||"Table1";

        let sqlTypes=options.sqlTypes||_sqlTypeMapping;

        let flattenedSchema=SchemaMagic.flattenSchema(schema);
        let cols=[];
        for (let path of flattenedSchema){
            let colName=path.path.replace(/\./g,options.separator);
            if (options.beautify)colName=_s.titleize(_s.humanize(colName));
            colName=charFunc(colName);
            let colType=sqlTypes.filter((t)=>{return t.type===path.type&&(path.format?t.format===path.format:true);})[0];
            colType=colType?colType.sqlType:options.defaultType;

            cols.push(colName + " " + colType + (path.required?" NOT":"") + " NULL");
        }

        return "CREATE TABLE " + charFunc(options.schema) + "." + charFunc(tableName) + "(\r\n" +
           cols.join(",\r\n") + ");"
    }

    //todo: required
    //todo: ranges
    //todo: formats like cron, email etc.
    //todo enums
    static generateSchemaFromJSON(obj){

        const generateSchemaPart=(partObj)=>{
            if (partObj===null){
                return {type:"null"};
            }else if ($check.array(partObj)){
                let schemaPart={
                    type:"array",
                    items:SchemaMagic.mergeSchemas(partObj.map((i)=>{
                        return generateSchemaPart(i);
                    }))
                };
                return schemaPart;
            }else if ($check.object(partObj)){
                let schemaPart={
                    type:"object",
                    properties:{}
                };
                for (let k in partObj){
                    if (!partObj.hasOwnProperty(k))continue;
                    schemaPart.properties[k]=generateSchemaPart(partObj[k]);
                }
                return schemaPart;
            }else if ($check.date(partObj)){
                return {type:"string",format:"date-time"};
            }else if ($check.string(partObj)){
                return {type:"string"};
            }else if ($check.integer(partObj)){
                return {type:"integer"};
            }else if ($check.number(partObj)){
                return {type:"number"};
            }else if ($check.boolean(partObj)){
                return {type:"boolean"};
            }else{
                return null;
            }
        };

        return generateSchemaPart(obj);

    }

    static mergeSchemas(schemas){
        if (!schemas||schemas.length===0)return null;

        schemas=schemas.filter(s=>!!s);
        if (schemas.length===1)return schemas[0];

        const hasType=(schemaType,searchType)=>{
            if ($check.array(schemaType)){
                return schemaType.indexOf(searchType)>-1;
            }else{
                return schemaType===searchType;
            }
        };

        return schemas.reduce((mergedSchema,curSchema)=>{
            const mergePart=(schemaPart,curPath)=>{
                if (!schemaPart)return;
                if (!$json.has(mergedSchema,curPath)){
                    $json.set(mergedSchema,curPath,schemaPart);
                    return;
                }
                let curMergePart=$json.get(mergedSchema,curPath);
                if (schemaPart.type==="object"&&!hasType(curMergePart.type,"object")){
                    //if its an object, it gets prefence
                    curMergePart.type="object";
                    curMergePart.properties=schemaPart.properties;
                }if (schemaPart.type==="object"&&hasType(curMergePart.type,"object")&&schemaPart.properties){
                    //merge in any strange properties
                    for (let k in schemaPart.properties){
                        if (!schemaPart.properties.hasOwnProperty(k))continue;
                        mergePart(schemaPart.properties[k],curPath.concat(["properties",k]));
                    }
                }else if (schemaPart.type==="array"&&!hasType(curMergePart.type,"array")){
                    mergePart(schemaPart.items,curPath.concat(["items"]));
                }else if (schemaPart.type==="array"&&hasType(curMergePart.type,"array")){
                    //if its an array, it gets prefence
                    curMergePart.type="array";
                    mergePart(schemaPart.items,curPath.concat(["items"]));
                }else if (schemaPart.type&&curMergePart.type){

                    let types=_.union($check.array(curMergePart.type)?curMergePart.type:[curMergePart.type],$check.array(schemaPart.type)?schemaPart.type:[schemaPart.type]);
                    if (types.length===1)types=types[0];
                    if (_.difference(types,["integer","number"]).length===0)types="number";
                    curMergePart.type=types;
                }else{
                    return;
                }


            };
            mergePart(curSchema,[]);
            return mergedSchema;
        });
    }

}

module.exports=SchemaMagic;