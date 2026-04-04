// Helper function to extract Cloudinary public_id from the URL
const extractPublicId = (imageUrl) => {
  const parts = imageUrl.split('/');
  const filename = parts.pop(); // gets "my_picture.jpg"
  const folder = parts.pop(); // gets "blog_images"
  const id = filename.split('.')[0]; // removes ".jpg" to get "my_picture"
  return `${folder}/${id}`; // returns "blog_images/my_picture"
};

module.exports = { extractPublicId };