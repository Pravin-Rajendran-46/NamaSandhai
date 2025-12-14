// backend/controllers/productController.js
const supabase = require('../config/supabase');

exports.getProducts = async (req, res) => {
    try {
        const { category, limit = 50, offset = 0 } = req.query;
        
        let query = supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const productData = req.body;
        
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getNearbyProducts = async (req, res) => {
    try {
        const { lat, lng, radius = 50, limit = 50 } = req.query;
        
        if (!lat || !lng) {
            return this.getProducts(req, res);
        }

        // For production, use PostGIS extension in Supabase
        // This is a simplified version
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Filter by distance (client-side for MVP)
        const nearbyProducts = data.filter(product => {
            if (!product.latitude || !product.longitude) return true;
            
            const distance = calculateDistance(
                parseFloat(lat),
                parseFloat(lng),
                product.latitude,
                product.longitude
            );
            
            return distance <= radius;
        }).sort((a, b) => {
            const distA = calculateDistance(lat, lng, a.latitude, a.longitude);
            const distB = calculateDistance(lat, lng, b.latitude, b.longitude);
            return distA - distB;
        });

        res.json({ success: true, data: nearbyProducts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}