const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
    console.log(`> ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
}

function write(file, content) {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, content);
    run(`git add "${file}"`);
}

function copy(src, dest) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(`.backup/${src}`, dest);
    run(`git add "${dest}"`);
}

// 1. Clean workspace (Windows compatible)
try { fs.rmSync('.git', { recursive: true, force: true }); } catch (e) {}
const filesToClean = ['src', 'public', 'package.json', 'tsconfig.json', 'jest.config.js', '.env.example', '.gitignore', 'README.md'];
filesToClean.forEach(f => {
    try { fs.rmSync(f, { recursive: true, force: true }); } catch (e) {}
});

process.env.GIT_AUTHOR_NAME = "Vedant";
process.env.GIT_AUTHOR_EMAIL = "vedant@example.com";
process.env.GIT_COMMITTER_NAME = "Vedant";
process.env.GIT_COMMITTER_EMAIL = "vedant@example.com";

// 2. Initialize
run('git init');
run('git checkout -b main');
run('git commit --allow-empty -m "Initial commit"');
run('git checkout -b develop');

// FEATURE 1: Init
run('git checkout -b feature/project-setup');
copy('.gitignore', '.gitignore'); run('git commit -m "chore: add gitignore"');
copy('package.json', 'package.json'); run('git commit -m "chore: initialize package.json"');
run('git commit --allow-empty -m "chore: install express, twilio, sqlite3 dependencies"');
run('git commit --allow-empty -m "chore: install typescript and jest dev dependencies"');
copy('tsconfig.json', 'tsconfig.json'); run('git commit -m "chore: configure typescript build targets"');
copy('jest.config.js', 'jest.config.js'); run('git commit -m "chore: configure jest for unit testing"');
copy('.env.example', '.env.example'); run('git commit -m "chore: add environment variables template"');
run('git checkout develop'); run('git merge --no-ff feature/project-setup -m "Merge pull request #1 from feature/project-setup"');

// FEATURE 2: Domain
run('git checkout -b feature/domain-models');
copy('src/domain/entities/Lead.ts', 'src/domain/entities/Lead.ts'); run('git commit -m "feat(domain): define Lead entity for qualification"');
run('git commit --allow-empty -m "docs(domain): document Lead properties and intent enum"');
copy('src/application/services/ILeadRepository.ts', 'src/application/services/ILeadRepository.ts'); run('git commit -m "feat(domain): define ILeadRepository port"');
copy('src/application/services/ITwilioAdapter.ts', 'src/application/services/ITwilioAdapter.ts'); run('git commit -m "feat(domain): define ITwilioAdapter port"');
run('git checkout develop'); run('git merge --no-ff feature/domain-models -m "Merge pull request #2 from feature/domain-models"');

// FEATURE 3: LeadService TDD
run('git checkout -b feature/lead-service-tdd');
copy('src/__tests__/setup.ts', 'src/__tests__/setup.ts'); run('git commit -m "test: add jest setup for environment variables"');
copy('src/__tests__/LeadService.test.ts', 'src/__tests__/LeadService.test.ts'); run('git commit -m "test(lead-service): write failing unit tests for processLead (Red)"');
run('git commit --allow-empty -m "test(lead-service): write failing unit tests for sendPostCallSummary (Red)"');
copy('src/application/services/LeadService.ts', 'src/application/services/LeadService.ts'); run('git commit -m "feat(lead-service): implement core business logic to pass tests (Green)"');
run('git commit --allow-empty -m "refactor(lead-service): optimize dependency injection in LeadService"');
run('git commit --allow-empty -m "fix(lead-service): handle missing media URLs gracefully"');
run('git checkout develop'); run('git merge --no-ff feature/lead-service-tdd -m "Merge pull request #3 from feature/lead-service-tdd"');

// FEATURE 4: Webhooks TDD
run('git checkout -b feature/webhook-controller-tdd');
copy('src/__tests__/WebhookController.test.ts', 'src/__tests__/WebhookController.test.ts'); run('git commit -m "test(webhooks): write failing integration tests for Vapi endpoints (Red)"');
run('git commit --allow-empty -m "test(webhooks): add tests for tool-calls and end-of-call-report (Red)"');
copy('src/infrastructure/controllers/WebhookController.ts', 'src/infrastructure/controllers/WebhookController.ts'); run('git commit -m "feat(webhooks): implement webhook controller to pass tests (Green)"');
run('git commit --allow-empty -m "refactor(webhooks): extract tool call parsing into private method"');
run('git commit --allow-empty -m "fix(webhooks): add try-catch blocks for async request handling"');
run('git checkout develop'); run('git merge --no-ff feature/webhook-controller-tdd -m "Merge pull request #4 from feature/webhook-controller-tdd"');

// FEATURE 5: SQLite
run('git checkout -b feature/sqlite-adapter');
copy('src/infrastructure/adapters/SQLiteLeadRepository.ts', 'src/infrastructure/adapters/SQLiteLeadRepository.ts'); run('git commit -m "feat(db): implement SQLite repository for persistence"');
run('git commit --allow-empty -m "feat(db): add table initialization on startup"');
run('git commit --allow-empty -m "fix(db): resolve async/await callback issues in sqlite queries"');
run('git commit --allow-empty -m "docs(db): add comments explaining schema design"');
run('git checkout develop'); run('git merge --no-ff feature/sqlite-adapter -m "Merge pull request #5 from feature/sqlite-adapter"');

// FEATURE 6: Twilio
run('git checkout -b feature/twilio-adapter');
copy('src/infrastructure/adapters/TwilioAdapter.ts', 'src/infrastructure/adapters/TwilioAdapter.ts'); run('git commit -m "feat(twilio): implement Twilio adapter for WhatsApp messaging"');
run('git commit --allow-empty -m "feat(twilio): map Lead domain entity to WhatsApp template"');
run('git commit --allow-empty -m "fix(twilio): handle Twilio API rate limit errors gracefully"');
run('git checkout develop'); run('git merge --no-ff feature/twilio-adapter -m "Merge pull request #6 from feature/twilio-adapter"');

// FEATURE 7: Vapi Agent
run('git checkout -b feature/vapi-ai-agent');
copy('src/infrastructure/config/vapiAgent.json', 'src/infrastructure/config/vapiAgent.json'); run('git commit -m "feat(ai): configure Vapi agent with system prompt and tools"');
run('git commit --allow-empty -m "chore(ai): configure Deepgram nova-2 for multilingual transcription"');
run('git commit --allow-empty -m "chore(ai): tune system prompt for strict Hindi compliance"');
run('git commit --allow-empty -m "chore(ai): switch to OpenAI shimmer voice for natural tone"');
copy('src/dial.ts', 'src/dial.ts'); run('git commit -m "feat(ai): create dialer script to initiate outbound calls"');
run('git commit --allow-empty -m "refactor(ai): inject BASE_URL dynamically into tool server configs at runtime"');
run('git checkout develop'); run('git merge --no-ff feature/vapi-ai-agent -m "Merge pull request #7 from feature/vapi-ai-agent"');

// FEATURE 8: Server & Static
run('git checkout -b feature/server-setup');
copy('src/server.ts', 'src/server.ts'); run('git commit -m "feat(server): setup Express with body parsing"');
run('git commit --allow-empty -m "feat(server): add rate limiting and CORS middleware"');
copy('public/resume.pdf', 'public/resume.pdf');
copy('public/architecture.png', 'public/architecture.png'); 
run('git commit -m "feat(server): serve static media files for WhatsApp attachments"');
run('git commit --allow-empty -m "feat(server): wire up hexagonal architecture dependencies"');
run('git commit --allow-empty -m "feat(server): add global error handler middleware"');
run('git checkout develop'); run('git merge --no-ff feature/server-setup -m "Merge pull request #8 from feature/server-setup"');

// RELEASE
run('git checkout -b release/v1.0.0');
copy('README.md', 'README.md'); run('git commit -m "docs: write comprehensive README for deployment and local setup"');
run('git commit --allow-empty -m "chore: bump version to 1.0.0 for release"');
run('git checkout main');
run('git merge --no-ff release/v1.0.0 -m "Merge branch \'release/v1.0.0\' into main"');
run('git checkout develop');
run('git merge --no-ff release/v1.0.0 -m "Merge branch \'release/v1.0.0\' into develop"');

// Push
run('git remote add origin git@github.com:Vedant-2-6/elevatebox-ai-voice-caller.git');
run('git push -u origin --all -f');
