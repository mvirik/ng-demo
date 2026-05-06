using FinApi.Models;
using Microsoft.AspNetCore.SignalR;

namespace FinApi.Hubs;

public class StockHub : Hub
{
    public async Task SubscribeToSymbol(string symbol)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, symbol.ToUpperInvariant());
    }

    public async Task UnsubscribeFromSymbol(string symbol)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, symbol.ToUpperInvariant());
    }
}
