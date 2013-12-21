class TerrainTypesController < ApplicationController
  before_filter :authenticate_user!, except: [:index]
  before_filter :build_terrain_type, only: [:new, :create]
  before_filter :get_terrain_type, only: [:edit, :update, :destroy]
  before_filter :authorize, except: [:index]

  def index
    @terrain_types = TerrainType.all
  end

  def new
  end

  def create
    save "new"
  end

  def edit
  end

  def update
    save "edit"
  end

  def destroy
    @terrain_type.destroy
    redirect_to :terrain_types
  end

  protected

  def build_terrain_type
    @terrain_type = TerrainType.new
  end

  def get_terrain_type
    @terrain_type = TerrainType.find(params[:id])
  end

  def authorize
    authorize_action_for @terrain_type
  end

  def terrain_type_params
    params.require(:terrain_type).permit(:name, :image)
  end

  def save render_on_failure
    if @terrain_type.update_attributes(terrain_type_params)
      redirect_to @terrain_type
    else
      render render_on_failure
    end
  end
end
