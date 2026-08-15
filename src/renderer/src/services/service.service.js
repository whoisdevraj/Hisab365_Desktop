export const serviceService = {
  // Fetch all services
  getServices: async () => {
    try {
      const services = await window.api.db.select('SELECT * FROM services ORDER BY description ASC')
      return services
    } catch (error) {
      console.error('Error fetching services:', error)
      throw error
    }
  },

  // Fetch a single service by ID
  getServiceById: async (id) => {
    try {
      const services = await window.api.db.select('SELECT * FROM services WHERE id = ?', [id])
      return services.length > 0 ? services[0] : null
    } catch (error) {
      console.error('Error fetching service:', error)
      throw error
    }
  },

  // Create a new service
  createService: async (serviceData) => {
    try {
      const sql = `
        INSERT INTO services (
          description, 
          sac_code, 
          gst_percent, 
          adValoremCess, 
          nonAdValoremCess, 
          unit, 
          rate
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      const params = [
        serviceData.description,
        serviceData.sac_code || '',
        serviceData.gst_percent || 0,
        serviceData.adValoremCess || 0,
        serviceData.nonAdValoremCess || 0,
        serviceData.unit || 'Lumpsum',
        serviceData.rate || 0
      ]

      const result = await window.api.db.execute(sql, params)
      return { success: true, id: result.lastInsertRowid }
    } catch (error) {
      console.error('Error creating service:', error)
      throw error
    }
  },

  // Update an existing service
  updateService: async (id, serviceData) => {
    try {
      const sql = `
        UPDATE services SET 
          description = ?, 
          sac_code = ?, 
          gst_percent = ?, 
          adValoremCess = ?, 
          nonAdValoremCess = ?, 
          unit = ?, 
          rate = ?
        WHERE id = ?
      `
      const params = [
        serviceData.description,
        serviceData.sac_code || '',
        serviceData.gst_percent || 0,
        serviceData.adValoremCess || 0,
        serviceData.nonAdValoremCess || 0,
        serviceData.unit || 'Lumpsum',
        serviceData.rate || 0,
        id
      ]

      await window.api.db.execute(sql, params)
      return { success: true }
    } catch (error) {
      console.error('Error updating service:', error)
      throw error
    }
  },

  // Delete a service
  deleteService: async (id) => {
    try {
      await window.api.db.execute('DELETE FROM services WHERE id = ?', [id])
      return { success: true }
    } catch (error) {
      console.error('Error deleting service:', error)
      throw error
    }
  }
}
