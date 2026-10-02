using System.Security.Claims;
using GreenNest.Services;
using Microsoft.AspNetCore.Mvc;

namespace GreenNest.ViewComponents;

public class RecommendedProductsViewComponent : ViewComponent
{
    private readonly IRecommendationService _recs;
    public RecommendedProductsViewComponent(IRecommendationService recs) => _recs = recs;

    public async Task<IViewComponentResult> InvokeAsync(int take = 4)
    {
        var userId = UserClaimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);
        return View(await _recs.GetForUserAsync(userId, take));
    }
}
