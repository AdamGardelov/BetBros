namespace BetBros.Server.Services;

/// <summary>
/// Background service that pings the app to prevent Azure free tier from sleeping.
/// Note: This service only works while the app is running. If the app is already asleep,
/// it cannot wake itself. For maximum reliability, also use an external service (like UptimeRobot)
/// to ping the /keepalive endpoint every 5-10 minutes.
/// </summary>
public class KeepAliveService(ILogger<KeepAliveService> logger, IHttpClientFactory httpClientFactory) : BackgroundService
{
    private readonly bool _isAzure = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME"));

    // Only run keep-alive on Azure (free tier apps go to sleep)

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_isAzure)
        {
            logger.LogInformation("Keep-alive service disabled (not running on Azure)");
            return;
        }

        logger.LogInformation("Keep-alive service started");

        // Wait a bit before first ping to let the app fully start
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Ping every 10 minutes (Azure free tier typically sleeps after 20 minutes of inactivity)
                await PingAppAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected when shutting down
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in keep-alive service");
                // Wait a bit before retrying
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        logger.LogInformation("Keep-alive service stopped");
    }

    private async Task PingAppAsync(CancellationToken cancellationToken)
    {
        try
        {
            var httpClient = httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);
            
            // Get the app URL from environment
            var appUrl = Environment.GetEnvironmentVariable("WEBSITE_HOSTNAME");
            if (string.IsNullOrEmpty(appUrl))
            {
                // Not on Azure, skip
                return;
            }

            // Use HTTPS (Azure Web Apps always use HTTPS)
            var url = $"https://{appUrl}/keepalive";

            logger.LogDebug("Pinging keep-alive endpoint at {Url}", url);

            var response = await httpClient.GetAsync(url, cancellationToken);
            
            if (response.IsSuccessStatusCode)
            {
                logger.LogDebug("Keep-alive ping successful");
            }
            else
            {
                logger.LogWarning("Keep-alive ping returned status {StatusCode}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Keep-alive ping failed (this is usually fine if the app is starting up or sleeping)");
        }
    }
}

