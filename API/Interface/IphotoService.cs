using CloudinaryDotNet.Actions;

namespace API.Interface;

public interface IphotoService
{
    Task<ImageUploadResult> AddPhotoAsync(IFormFile file);

    Task<DeletionResult> DeletePhotoAsync(string publicId);
}