class PieceTypesController < ApplicationController
  before_filter :authenticate_user!, except: [:index, :show]
  before_filter :build_piece_type, only: [:new, :create]
  before_filter :get_piece_type, only: [:show, :edit, :update, :destroy]
  before_filter :authorize, except: [:index, :show]

  def index
    @piece_types = PieceType.all
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
    @piece_type.destroy
    redirect_to :piece_types
  end

  protected

  def build_piece_type
    @piece_type = PieceType.new
  end

  def get_piece_type
    @piece_type = PieceType.find(params[:id])
  end

  def authorize
    authorize_action_for @piece_type
  end

  def piece_type_params
    params.require(:piece_type).permit(:name, :alabaster_image, :onyx_image)
  end

  def save render_on_failure
    if @piece_type.update_attributes(piece_type_params)
      redirect_to @piece_type
    else
      render render_on_failure
    end
  end
end
