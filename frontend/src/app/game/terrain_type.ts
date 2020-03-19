export class TerrainType {
  private urlMap: Map<string, string>;

  constructor() {
    this.urlMap = new Map<string, string>();
  }

  setData(data: Map<string, string>): void {
    this.urlMap = data;
  }

  urlFor(terrainTypeId: string): string {
    return this.urlMap.get(terrainTypeId);
  }
}

export default new TerrainType();
