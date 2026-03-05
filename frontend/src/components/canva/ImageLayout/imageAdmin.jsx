import React, { useEffect, useState } from 'react'
import { getPublicTemplateImages } from '../../../services/imageEditor/imageApi'

const ImageAdmin = () => {
    const [resp, setResp] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getPublicTemplateImages()
                console.log("Fetched Public Template Images:", data)
                setResp(data)
            } catch (err) {
                setError(err.message || 'Failed to fetch')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <div style={{ padding: 16 }}>
            <h3>Template Images</h3>
            {loading && <div>Loading...</div>}
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            {resp && (
                <div style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflow: 'auto', background: '#f6f8fa', padding: 12, borderRadius: 6 }}>
                    <pre>{JSON.stringify(resp, null, 2)}</pre>
                </div>
            )}
        </div>
    )
}

export default ImageAdmin;



