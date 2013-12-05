class TerrainRulesController < ApplicationController
  before_filter :authenticate_user!
  before_filter :build_terrain_rule, only: [:new, :create]
  before_filter :get_terrain_rule, only: [:edit, :update, :destroy]
  before_filter :authorize

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
    @terrain_rule.destroy
    redirect_to @terrain_rule.variant
  end

  protected

  def build_terrain_rule
    @variant = Variant.find(params[:variant_id])
    @terrain_rule = @variant.terrain_rules.build
  end

  def get_terrain_rule
    @terrain_rule = TerrainRule.find(params[:id])
  end

  def authorize
    authorize_action_for @terrain_rule
  end

  def terrain_rule_params
    params.require(:terrain_rule).permit(
      :terrain_type_id,
      :block_movement
    )
  end

  def save render_on_failure
    if @terrain_rule.update_attributes(terrain_rule_params)
      redirect_to @terrain_rule.variant
    else
      render render_on_failure
    end
  end
end
