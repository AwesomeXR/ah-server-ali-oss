import { IBaseExtension } from 'ah-server';
import { IOssServiceCfg, OssService } from './OssService';

declare module 'ah-server' {
  interface IService {
    oss: OssService;
  }
}

export class OssExtension implements IBaseExtension {
  constructor(readonly cfg: IOssServiceCfg) {}

  service = { oss: OssService };

  lifeCycle: IBaseExtension['lifeCycle'] = {
    setup: async app => {
      app.service.oss.init(this.cfg);
    },
  };
}
