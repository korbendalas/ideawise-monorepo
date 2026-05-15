<?php

namespace App\Command;

use App\Service\Upload\UploadCleanupService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:uploads:cleanup-incomplete', description: 'Expires incomplete upload sessions and removes temporary chunks.')]
final class CleanupIncompleteUploadsCommand extends Command
{
    public function __construct(private readonly UploadCleanupService $cleanupService)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $count = $this->cleanupService->cleanupIncomplete();
        $output->writeln(sprintf('Expired %d incomplete upload(s).', $count));

        return Command::SUCCESS;
    }
}
