# Template Dimensions API Guide

## Overview
The backend now supports storing and retrieving accurate layer dimensions from After Effects templates. This allows the frontend to display correct dimension requirements to users for image/video cropping.

## API Endpoints

### 1. Get Template Fields with Dimensions
```
GET /render/templates/:templateId/fields
```

**Response:**
```json
{
  "templateId": 1,
  "fields": {
    "text1": {
      "layerName": "txt_1",
      "width": 1080,
      "height": 200,
      "dimensions": "1080x200"
    },
    "image1": {
      "layerName": "img_1.png",
      "width": 1080,
      "height": 1920,
      "dimensions": "1080x1920"
    },
    "background": {
      "layerName": "background.png",
      "width": 1080,
      "height": 1920,
      "dimensions": "1080x1920"
    }
  }
}
```

### 2. Update Template Field Dimensions (Admin Only)
```
PUT /render/templates/:templateId/fields
```

**Request Body:**
```json
{
  "fields": {
    "text1": { "width": 1080, "height": 200 },
    "image1": { "width": 1080, "height": 1920 },
    "image2": { "width": 1080, "height": 1920 },
    "background": { "width": 1080, "height": 1920 }
  }
}
```

## Setting Dimensions for Templates 1-11

Use the API to set dimensions for each template. Here's an example using curl:

```bash
# Template 1: Image & Text
curl -X PUT http://localhost:8000/render/templates/1/fields \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "fields": {
      "text1": { "width": 1080, "height": 200 },
      "text2": { "width": 1080, "height": 200 },
      "image1": { "width": 1080, "height": 1920 },
      "image2": { "width": 1080, "height": 1920 },
      "background": { "width": 1080, "height": 1920 }
    }
  }'

# Template 2: Icon & Text
curl -X PUT http://localhost:8000/render/templates/2/fields \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "fields": {
      "text1": { "width": 1080, "height": 200 },
      "icon1": { "width": 512, "height": 512 },
      "icon2": { "width": 512, "height": 512 },
      "background": { "width": 1080, "height": 1920 }
    }
  }'

# ... continue for templates 3-11
```

## Suggested Dimensions (Update based on your actual AE templates)

```javascript
const templateDimensions = {
  1: { text1: [1080,200], text2: [1080,200], image1: [1080,1920], image2: [1080,1920], background: [1080,1920] },
  2: { text1: [1080,200], icon1: [512,512], icon2: [512,512], background: [1080,1920] },
  3: { text1: [1080,200], text2: [1080,200], icon1: [512,512], background: [1080,1920] },
  4: { text1: [1080,200], icon1: [512,512], icon2: [512,512], icon3: [512,512], background: [1080,1920] },
  5: { text1: [1080,200], icon1: [512,512], icon2: [512,512], background: [1080,1920] },
  6: { text1: [1080,200], text2: [1080,200], video1: [1080,1920], background: [1080,1920] },
  7: { text1: [1080,200], text2: [1080,200], text3: [1080,200], background: [1080,1920] },
  8: { text1: [1080,200], text2: [1080,200], icon1: [512,512], icon2: [512,512], icon3: [512,512], icon4: [512,512], background: [1080,1920] },
  9: { icon1: [512,512], icon2: [512,512], icon3: [512,512], icon4: [512,512], background: [1080,1920] },
  10: { text1: [1080,200], icon1: [512,512], icon2: [512,512], background: [1080,1920] },
  11: { text1: [1080,200], video1: [1080,1920], video2: [1080,1920], background: [1080,1920] }
};
```

## Frontend Integration

Update your frontend to fetch dimensions from the API:

```typescript
// Fetch template fields with dimensions
const { data } = await api.get(`/render/templates/${templateId}/fields`);

// Use the dimensions in your UI
{data.fields.image1 && (
  <p className="text-xs text-muted-foreground">
    Recommended: {data.fields.image1.dimensions}
  </p>
)}
```

## Notes

1. **Text layers** typically don't need precise dimensions (width/height represent text box bounds)
2. **Image/Video layers** should match exact AE layer sizes for best quality
3. **Icon layers** are usually square (512x512 recommended)
4. **Background layers** should match composition size (typically 1080x1920 for vertical videos)

## Next Steps

1. **Extract actual dimensions** from your After Effects templates
2. **Update dimensions** via the API for each template
3. **Update frontend** to fetch and display these dimensions
4. **Add image cropper** in frontend to help users resize/crop to exact dimensions
