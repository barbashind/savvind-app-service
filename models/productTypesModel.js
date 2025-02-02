import { Sequelize } from "sequelize";
import db from "../config/database.js";
 
const { DataTypes } = Sequelize;
 
const ProductType = db.define('product_types',{
    
    label:{
        type: DataTypes.STRING
    }

},{
    freezeTableName: true
});
 
export default ProductType;