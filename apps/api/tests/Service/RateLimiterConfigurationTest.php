<?php

namespace App\Tests\Service;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Yaml\Yaml;

final class RateLimiterConfigurationTest extends TestCase
{
    public function testUploadApiRateLimitMatchesAssignmentRequirement(): void
    {
        $config = Yaml::parseFile(__DIR__.'/../../config/packages/framework.yaml');

        self::assertSame(10, $config['framework']['rate_limiter']['upload_api']['limit']);
        self::assertSame('1 minute', $config['framework']['rate_limiter']['upload_api']['interval']);
    }
}
