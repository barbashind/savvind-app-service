import Deliver from "../models/deliversModel.js";

 
export const getAllDelivers = async (req, res) => {
    try {
        const delivers = await Deliver.findAll();
        res.json(delivers);
    } catch (error) {
        res.json({ message: error.message });
    }  
}