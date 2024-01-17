import * as OSS from 'ali-oss';
import { extname } from 'path';
import * as dayjs from 'dayjs';
import { BaseService, createBizError } from 'ah-server';
import { createHash } from 'crypto';

function md5(body: string | Buffer) {
  return createHash('md5').update(body).digest('hex');
}

export type IOssServiceCfg = {
  ak: string;
  sk: string;
  region: string;
  bucket: string;
  assumeRole?: string;
};

export class OssService extends BaseService {
  ossCfg!: IOssServiceCfg;
  client!: OSS;
  stsClient!: OSS.STS;

  init(cfg: IOssServiceCfg) {
    this.ossCfg = cfg;

    this.client = new OSS({
      accessKeyId: cfg.ak,
      accessKeySecret: cfg.sk,
      region: cfg.region,
      bucket: cfg.bucket,
    });

    this.stsClient = new OSS.STS({
      accessKeyId: cfg.ak,
      accessKeySecret: cfg.sk,
    });
  }

  /** 上传文件 */
  async putFile(name: string, file: Buffer) {
    const time = dayjs().format('YYYY/MM/DD');
    const path = `/file/${time}/${md5(file)}${extname(name)}`;

    const rsp = await this.client.put(path, file);

    return { path, url: rsp.url };
  }

  /**
   * 路径签名
   *
   * @param path oss 路径
   * @param expires 超时秒数
   */
  signatureUrl(path: string, expires = 10) {
    return this.client.signatureUrl(path, { expires }) as string;
  }

  /** STS 授权 */
  async assumeRole() {
    if (!this.ossCfg.assumeRole) throw createBizError('no assumeRole');

    const { credentials } = await this.stsClient.assumeRole!(this.ossCfg.assumeRole);

    return {
      credentials,
      oss: { region: this.ossCfg.region, bucket: this.ossCfg.bucket },
    };
  }
}
