// Create a test script
async function testSupabaseConnection() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Connection failed:', error);
    } else {
        console.log('Connection successful!', data);
    }
}

testSupabaseConnection();