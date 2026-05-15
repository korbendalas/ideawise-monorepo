<?php

namespace App\Command;

use App\Service\Upload\UploadCleanupService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:media:cleanup-expired', description: 'Deletes media files past retention.')]
final class CleanupExpiredMediaCommand extends Command
{
    public function __construct(private readonly UploadCleanupService $cleanupService)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $count = $this->cleanupService->cleanupExpiredMedia();
        $output->writeln(sprintf('Deleted %d expired media file(s).', $count));

        return Command::SUCCESS;
    }
}
