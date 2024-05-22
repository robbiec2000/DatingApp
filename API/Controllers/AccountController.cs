using System.Security.Cryptography;
using System.Text;
using API.Data;
using API.Data.Migrations;
using API.DTOs;
using API.Entities;
using API.Interface;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class AccountController: BaseApiController
{
    private readonly DataContext _context;
    private readonly ITokenService _tokenService;
    private readonly IMapper _mapper;

    public AccountController(DataContext context, ITokenService tokenService, IMapper mapper)
    {
        _context = context;
        _tokenService = tokenService;
        _mapper = mapper;
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
    {
        if (await UserExist(registerDto.Username))
        {
            return BadRequest("Username is taken");
        }

        var user = _mapper.Map<AppUser>(registerDto);
        
        using var hmac = new HMACSHA512();
        
        user.Username = registerDto.Username.ToLower();
        user.PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(registerDto.Password));
        user.PasswordSalt = hmac.Key;

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new UserDto
        {
            Username = user.Username,
            Token = _tokenService.CreateToken(user),
            KnownAs = user.KnownAs,
            Gender = user.Gender,
        };
    }
    
    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
    {
        var user = await _context.Users.Include(p => p.Photos)
            .SingleOrDefaultAsync(x => x.Username == loginDto.Username.ToLower());
        if (user == null)
        {
            return Unauthorized("incorrect username or password");
        }
        using var hmac = new HMACSHA512(user.PasswordSalt);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(loginDto.Password));

        if (!computedHash.SequenceEqual(user.PasswordHash))
        {
            return Unauthorized("incorrect username or password");
        }

        return new UserDto
        {
            Username = user.Username,
            Token = _tokenService.CreateToken(user),
            photoUrl = user.Photos.FirstOrDefault(x => x.IsMain)?.Url,
            KnownAs = user.KnownAs,
            Gender = user.Gender,
        };
    }

    private async Task<bool> UserExist(string username)
    {
        return await _context.Users.AnyAsync(user => user.Username == username.ToLower());
    }
}