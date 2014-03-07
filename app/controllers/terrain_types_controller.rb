class TerrainTypesController < ApplicationController

  def index
    @terrain_types = TerrainType.all
  end

end
