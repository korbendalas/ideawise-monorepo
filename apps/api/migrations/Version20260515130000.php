<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260515130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create media upload tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE upload_sessions (id VARCHAR(32) NOT NULL, original_file_name VARCHAR(255) NOT NULL, mime_type_from_client VARCHAR(120) NOT NULL, file_size INTEGER NOT NULL, client_checksum VARCHAR(128) DEFAULT NULL, chunk_size INTEGER NOT NULL, total_chunks INTEGER NOT NULL, status VARCHAR(32) NOT NULL, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, completed_at DATETIME DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE TABLE upload_chunks (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, upload_session_id VARCHAR(32) NOT NULL, chunk_index INTEGER NOT NULL, size INTEGER NOT NULL, storage_path VARCHAR(500) NOT NULL, received_at DATETIME NOT NULL, CONSTRAINT FK_UPLOAD_CHUNK_SESSION FOREIGN KEY (upload_session_id) REFERENCES upload_sessions (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX uniq_upload_chunk_index ON upload_chunks (upload_session_id, chunk_index)');
        $this->addSql('CREATE INDEX IDX_UPLOAD_CHUNK_SESSION ON upload_chunks (upload_session_id)');
        $this->addSql('CREATE TABLE media_files (id VARCHAR(32) NOT NULL, original_file_name VARCHAR(255) NOT NULL, stored_file_name VARCHAR(255) NOT NULL, mime_type VARCHAR(120) NOT NULL, size INTEGER NOT NULL, checksum VARCHAR(128) NOT NULL, storage_path VARCHAR(500) NOT NULL, public_url VARCHAR(500) NOT NULL, created_at DATETIME NOT NULL, expires_at DATETIME NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_media_checksum ON media_files (checksum)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE upload_chunks');
        $this->addSql('DROP TABLE upload_sessions');
        $this->addSql('DROP TABLE media_files');
    }
}
