using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace GreenNest.Services;

public interface IRecommendationService
{
    Task<List<Product>> GetForUserAsync(string? userId, int take = 4);
}

/// <summary>
/// User-based collaborative filtering (cosine similarity on binary purchase vectors).
/// Assumes: Orders(UserId), OrderItems(OrderId, ProductId, Order nav), Products(Id, ...).
/// Rename to match your DbContext. Register:
///   builder.Services.AddMemoryCache();
///   builder.Services.AddScoped&lt;IRecommendationService, RecommendationService&gt;();
/// </summary>
public class RecommendationService : IRecommendationService
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;

    public RecommendationService(AppDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<List<Product>> GetForUserAsync(string? userId, int take = 4)
    {
        var purchases = await GetPurchaseMatrixAsync();
        var ranked = new List<int>();
        var owned = new HashSet<int>();

        if (userId != null && purchases.TryGetValue(userId, out var mine))
        {
            owned = mine;
            var scores = new Dictionary<int, double>();

            foreach (var (otherId, theirs) in purchases)
            {
                if (otherId == userId) continue;

                var overlap = theirs.Count(mine.Contains);
                if (overlap == 0) continue;

                // cosine similarity for binary vectors
                var similarity = overlap / Math.Sqrt(mine.Count * (double)theirs.Count);

                foreach (var productId in theirs.Where(p => !mine.Contains(p)))
                    scores[productId] = scores.GetValueOrDefault(productId) + similarity;
            }

            ranked = scores.OrderByDescending(kv => kv.Value)
                           .Take(take)
                           .Select(kv => kv.Key)
                           .ToList();
        }

        // Cold start / too few neighbours: fill with best sellers
        if (ranked.Count < take)
        {
            var popular = await _db.OrderItems
                .GroupBy(i => i.ProductId)
                .OrderByDescending(g => g.Count())
                .Select(g => g.Key)
                .Take(take * 3)
                .ToListAsync();

            ranked.AddRange(popular.Where(p => !owned.Contains(p) && !ranked.Contains(p))
                                   .Take(take - ranked.Count));
        }

        var products = await _db.Products.Where(p => ranked.Contains(p.Id)).ToListAsync();
        return ranked.Select(id => products.First(p => p.Id == id)).ToList(); // keep rank order
    }

    private Task<Dictionary<string, HashSet<int>>> GetPurchaseMatrixAsync() =>
        _cache.GetOrCreateAsync("purchase-matrix", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);

            var pairs = await _db.OrderItems
                .Select(i => new { i.Order.UserId, i.ProductId })
                .Distinct()
                .ToListAsync();

            return pairs.GroupBy(p => p.UserId)
                        .ToDictionary(g => g.Key, g => g.Select(x => x.ProductId).ToHashSet());
        })!;
}
