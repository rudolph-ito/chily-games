class QuotesController < ApplicationController
  before_filter :authenticate_user!, except: [:index, :show]
  before_filter :build_quote, only: [:new, :create]
  before_filter :get_quote, only: [:show, :edit, :update, :destroy]
  before_filter :authorize, except: [:index, :show]

  def index
    @quotes = Quote.all
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
    @quote.destroy
    redirect_to :quotes
  end

  protected

  def build_quote
    @quote = Quote.new
  end

  def get_quote
    @quote = Quote.find(params[:id])
  end

  def authorize
    authorize_action_for @quote
  end

  def quote_params
    params.require(:quote).permit(
      :book_name, :book_number,
      :chapter_name, :chapter_number,
      :description, :number, :text
    )
  end

  def save render_on_failure
    if @quote.update_attributes(quote_params)
      redirect_to @quote
    else
      render render_on_failure
    end
  end
end
