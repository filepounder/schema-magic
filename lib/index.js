const $deepcopy=require('deepcopy');
const $json=require('json-magic');
const $check=require('check-types');
const $types=require('type-magic');
const _s=require('underscore.string');


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

}

module.exports=SchemaMagic;