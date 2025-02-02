import ProductType from "../models/productTypesModel.js";
 
export const getAllProductTypes = async (req, res) => {
    try {
        const productTypes = await ProductType.findAll();
        res.json(productTypes);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const getProductTypeByLabel = async (req, res) => {
    try {
        const productType = await ProductType.findAll({
            where: {
                label: req.params.label
            }
        });
        res.json(productType[0]);
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const createProductType = async (req, res) => {
    try {
        await ProductType.create(req.body);
        res.json({
            "message": "Product Created"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const updateProductType = async (req, res) => {
    try {
        await ProductType.update(req.body, {
            where: {
                id: req.params.id
            }
        });
        res.json({
            "message": "Product Updated"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}
 
export const deleteProductType = async (req, res) => {
    try {
        await ProductType.destroy({
            where: {
                id: req.params.id
            }
        });
        res.json({
            "message": "Product Deleted"
        });
    } catch (error) {
        res.json({ message: error.message });
    }  
}