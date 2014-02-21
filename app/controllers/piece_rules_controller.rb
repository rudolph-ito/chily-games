class PieceRulesController < ApplicationController
  before_filter :authenticate_user!
  before_filter :build_piece_rule, only: [:new, :create]
  before_filter :get_piece_rule, only: [:edit, :update, :destroy]
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
    if @piece_rule.piece_type.king?
      flash[:notice] = "You cannot delete the King"
    else
      @piece_rule.destroy
    end

    redirect_to @piece_rule.variant
  end

  protected

  def build_piece_rule
    @variant = Variant.find(params[:variant_id])
    @piece_rule = @variant.piece_rules.build
  end

  def get_piece_rule
    @piece_rule = PieceRule.find(params[:id])
  end

  def authorize
    authorize_action_for @piece_rule
  end

  def piece_rule_params
    params.require(:piece_rule).permit(
      :piece_type_id, :count,
      :movement_type, :movement_minimum, :movement_maximum,
      :capture_type,
      :range_type, :range_minimum, :range_maximum
    )
  end

  def save render_on_failure
    if @piece_rule.update_attributes(piece_rule_params)
      redirect_to @piece_rule.variant
    else
      render render_on_failure
    end
  end
end
