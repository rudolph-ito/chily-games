class VariantsController < ApplicationController
  before_filter :authenticate_user!, except: [:index, :show]
  before_filter :build_variant, only: [:new, :create]
  before_filter :get_variant, only: [:show, :edit, :update, :destroy]
  before_filter :authorize, except: [:index, :show]

  def index
    @variants = Variant.all
  end

  def new
  end

  def create
    save "new"
  end

  def show
  end

  def edit
  end

  def update
    save "edit"
  end

  def destroy
    @variant.destroy
    redirect_to :variants
  end

  protected

  def build_variant
    @variant = Variant.new(user: current_user)
  end

  def get_variant
    @variant = Variant.find(params[:id])
  end

  def authorize
    authorize_action_for @variant
  end

  def variant_params
    params.require(:variant).permit(
      :board_type, :board_size, :board_rows, :board_columns
    )
  end

  def save render_on_failure
    if @variant.update_attributes(variant_params)
      redirect_to @variant
    else
      render render_on_failure
    end
  end
end
