class Api::VariantsController < ApplicationController
  before_filter :authenticate_user!, except: :preview
  before_filter :get_variant, except: [:index]
  decorates_assigned :variants

  def index
    @variants = Variant.all
  end

  def preview
  end

  def review
  end

  def update_review
    UpdateReview.new(@variant, current_user, params[:rating], params[:comment]).call
    head :no_content
  end

  protected

  def get_variant
    @variant = Variant.find(params[:id])
  end
end
