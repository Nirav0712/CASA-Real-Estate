import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { MONGO_CONNECTION } from '../../database/database.module';

describe('HealthService', () => {
  let service: HealthService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test'),
  };

  const mockConnection = {
    readyState: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MONGO_CONNECTION, useValue: mockConnection },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return system health info without secrets', () => {
    const health = service.getHealth();
    expect(health.status).toBe('ok');
    expect(health.version).toBe('1.0.0');
    expect(health.database.connected).toBe(true);
    expect(health).not.toHaveProperty('database.uri');
  });
});
